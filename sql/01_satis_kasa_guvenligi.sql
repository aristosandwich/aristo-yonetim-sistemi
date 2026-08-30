-- Aristo satış / adisyon / gider / kasa düzeltmesi — 28.08.2026
-- Önce mevcut yedeği indirin. Eski uygulama sekmelerini kapatın.
-- Mevcut satış/giderler ve kasa bakiyesi yeniden hesaplanmaz veya silinmez.
-- Bu dosya tek transaction'dır: bir adım başarısızsa değişiklikler geri alınır.
BEGIN;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['satislar','acik_adisyonlar','giderler','kasa'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE EXCEPTION 'Gerekli tablo bulunamadı: %', t;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = to_regclass('public.' || t)
      AND NOT tgisinternal AND tgname <> 'aristo_v2_yazma_korumasi') THEN
      RAISE EXCEPTION 'Önce mevcut otomatik işlemi inceleyin: %', t;
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.satislar ADD COLUMN IF NOT EXISTS surum bigint NOT NULL DEFAULT 1;
ALTER TABLE public.acik_adisyonlar ADD COLUMN IF NOT EXISTS surum bigint NOT NULL DEFAULT 1;
ALTER TABLE public.giderler ADD COLUMN IF NOT EXISTS surum bigint NOT NULL DEFAULT 1;
ALTER TABLE public.kasa ADD COLUMN IF NOT EXISTS surum bigint NOT NULL DEFAULT 1;

-- Eksikse boş kasa oluşturulur. Mevcut tutar kesinlikle değiştirilmez.
INSERT INTO public.kasa (id, tutar) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.aristo_islem_sonuclari_v2 (
  id uuid PRIMARY KEY,
  kullanici_id uuid NOT NULL,
  tur text NOT NULL,
  veri jsonb NOT NULL,
  sonuc jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.aristo_islem_sonuclari_v2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS aristo_v2_sonuc_okuma ON public.aristo_islem_sonuclari_v2;
CREATE POLICY aristo_v2_sonuc_okuma ON public.aristo_islem_sonuclari_v2
  FOR SELECT TO authenticated USING (kullanici_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS aristo_v2_sonuc_yazma ON public.aristo_islem_sonuclari_v2;
CREATE POLICY aristo_v2_sonuc_yazma ON public.aristo_islem_sonuclari_v2
  FOR INSERT TO authenticated WITH CHECK (kullanici_id = (SELECT auth.uid()));
REVOKE ALL ON public.aristo_islem_sonuclari_v2 FROM PUBLIC, anon;
GRANT SELECT, INSERT ON public.aristo_islem_sonuclari_v2 TO authenticated;

-- Eski sekmelerin doğrudan upsert/delete ile yeni kayıtları ezmesini engeller.
-- Veritabanı sahibi SQL Editor'de bakım yapabilir; tarayıcı yalnızca RPC kullanır.
CREATE OR REPLACE FUNCTION public.aristo_v2_yazma_korumasi()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin') AND
    (auth.uid() IS NULL OR current_setting('aristo.yazma_v2', true) IS DISTINCT FROM 'acik') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001',
      MESSAGE = 'Eski sürümden yazma kapatıldı. Aristo sayfasını yenileyin.';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['satislar','acik_adisyonlar','giderler','kasa','aristo_islem_sonuclari_v2'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS aristo_v2_yazma_korumasi ON public.%I', t);
    EXECUTE format('CREATE TRIGGER aristo_v2_yazma_korumasi BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.aristo_v2_yazma_korumasi()', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.aristo_v2_kurus(p_deger text)
RETURNS bigint LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF p_deger IS NULL OR p_deger !~ '^[0-9]+([.][0-9]{1,2})?$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Tutar geçersiz; en fazla iki ondalık basamak kullanın.';
  END IF;
  IF p_deger::numeric > 9999999999.99 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Tutar izin verilen sınırı aşıyor.';
  END IF;
  RETURN (p_deger::numeric * 100)::bigint;
END $$;

-- Bütün mutasyonlar mevcut kasa satırını kilitler. Böylece kimlik üretimi,
-- kasa artışı, adisyon sürümü ve tekrar kontrolü aynı transaction'da sıralanır.
-- SECURITY INVOKER: mevcut tablo RLS kuralları ve kullanıcı izinleri korunur.
CREATE OR REPLACE FUNCTION public.aristo_yaz_v2(p_istek uuid, p_tur text, p_veri jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_kullanici uuid := auth.uid();
  v_onceki public.aristo_islem_sonuclari_v2%ROWTYPE;
  v_kasa public.kasa%ROWTYPE;
  v_masa public.acik_adisyonlar%ROWTYPE;
  v_gider public.giderler%ROWTYPE;
  v_sonuc jsonb := '{}'::jsonb;
  v_satirlar jsonb := '[]'::jsonb;
  v_satir jsonb;
  v_sepet jsonb;
  v_adisyon_id text;
  v_islem bigint;
  v_satir_id bigint;
  v_surum bigint;
  v_beklenen bigint;
  v_adet integer;
  v_n integer;
  v_i integer;
  v_j integer;
  v_ara bigint := 0;
  v_indirim bigint;
  v_nakit bigint;
  v_kart bigint;
  v_toplam bigint;
  v_kalan bigint;
  v_baz bigint[] := '{}';
  v_indirimler bigint[];
  v_netler bigint[];
  v_nakitler bigint[];
  v_eski_nakit numeric := 0;
  v_delta numeric := 0;
  v_tarih text;
  v_platform text;
  v_adisyon text;
  v_odeme text;
  v_sayac integer;
BEGIN
  IF v_kullanici IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Oturum açmanız gerekiyor.';
  END IF;
  IF p_istek IS NULL OR p_veri IS NULL OR jsonb_typeof(p_veri) <> 'object'
     OR p_tur IS NULL OR p_tur NOT IN ('adisyon','satis','satis_sil','gider','gider_sil','kasa') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'İşlem biçimi geçersiz.';
  END IF;

  SELECT * INTO v_kasa FROM public.kasa WHERE id = 1 FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Kasa kaydı veya kasa erişim yetkisi bulunamadı.';
  END IF;
  SELECT * INTO v_onceki FROM public.aristo_islem_sonuclari_v2 WHERE id = p_istek;
  IF FOUND THEN
    IF v_onceki.kullanici_id <> v_kullanici OR v_onceki.tur <> p_tur OR v_onceki.veri <> p_veri THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'İşlem anahtarı farklı bir kayıt için kullanılamaz.';
    END IF;
    RETURN v_onceki.sonuc;
  END IF;
  PERFORM set_config('aristo.yazma_v2', 'acik', true);

  IF p_tur IN ('adisyon','satis') THEN
    v_sepet := p_veri->'sepet';
    IF v_sepet IS NULL OR jsonb_typeof(v_sepet) <> 'array' THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Sepet biçimi geçersiz.';
    END IF;
    v_n := jsonb_array_length(v_sepet);
    IF v_n > 250 OR (p_tur = 'satis' AND v_n = 0) THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Sepet boş veya satır sınırını aşıyor.';
    END IF;
    FOR v_satir IN SELECT value FROM jsonb_array_elements(v_sepet) LOOP
      IF jsonb_typeof(v_satir) <> 'object' OR coalesce(v_satir->>'urun', '') = ''
        OR coalesce(v_satir->>'adet','') !~ '^[1-9][0-9]{0,3}$'
        OR coalesce(v_satir->>'satirId','') !~ '^[0-9]{1,16}$' THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Sepet satırı veya ürün adedi geçersiz.';
      END IF;
      IF (v_satir->>'satirId')::numeric > 9007199254740991 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Sepet satır numarası geçersiz.';
      END IF;
      v_adet := (v_satir->>'adet')::integer;
      v_toplam := v_adet * (public.aristo_v2_kurus(v_satir->>'birimFiyat') +
        public.aristo_v2_kurus(coalesce(v_satir->>'extra','0')));
      IF v_toplam > 999999999999 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Satır toplamı sınırı aşıyor.';
      END IF;
      v_baz := array_append(v_baz, v_toplam);
      v_ara := v_ara + v_toplam;
    END LOOP;
    IF (SELECT count(DISTINCT value->>'satirId') FROM jsonb_array_elements(v_sepet)) <> v_n THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Sepette tekrar eden satır numarası var.';
    END IF;
    v_indirim := public.aristo_v2_kurus(coalesce(p_veri->>'indirim','0'));
    IF (p_tur = 'satis' AND v_indirim > v_ara) OR v_ara > 999999999999 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'İndirim veya sepet toplamı geçersiz.';
    END IF;
  END IF;

  IF p_tur = 'adisyon' THEN
    v_adisyon_id := p_veri->>'id';
    IF v_adisyon_id IS NULL OR v_adisyon_id !~ '^(masa-[1-4]|dis-[1-4]|take-away-[1-3])$'
      OR nullif(p_veri->>'ad','') IS NULL OR p_veri->>'grup' IS NULL
      OR p_veri->>'grup' NOT IN ('Masa','Dış','Take Away') THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Masa bilgisi geçersiz.';
    END IF;
    v_beklenen := (p_veri->>'beklenenSurum')::bigint;
    IF v_beklenen IS NULL OR v_beklenen < 0 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Masa sürümü eksik.';
    END IF;
    SELECT * INTO v_masa FROM public.acik_adisyonlar WHERE id = v_adisyon_id FOR UPDATE;
    IF (FOUND AND v_masa.surum <> v_beklenen) OR (NOT FOUND AND v_beklenen <> 0) THEN
      RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'Bu masa başka bir işlemde değişti. Kaydınızın üzerine yazılmadı; güncel masayı yeniden yükleyin.';
    END IF;
    IF p_veri->>'odeme_tipi' NOT IN ('Nakit','Kredi Kartı','Bölünmüş Ödeme')
      OR p_veri->>'odeme_tipi' IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Ödeme tipi geçersiz.';
    END IF;
    PERFORM public.aristo_v2_kurus(coalesce(nullif(p_veri->>'nakit_tutari',''),'0'));
    PERFORM public.aristo_v2_kurus(coalesce(nullif(p_veri->>'kart_tutari',''),'0'));
    INSERT INTO public.acik_adisyonlar
      (id,ad,grup,sepet,odeme_tipi,nakit_tutari,kart_tutari,indirim,"not",acilis_zamani,updated_at,surum)
    VALUES (v_adisyon_id,p_veri->>'ad',p_veri->>'grup',v_sepet,p_veri->>'odeme_tipi',
      coalesce(nullif(p_veri->>'nakit_tutari',''),'0'),coalesce(nullif(p_veri->>'kart_tutari',''),'0'),
      (v_indirim::numeric/100)::numeric(12,2)::text,coalesce(p_veri->>'not',''),
      CASE WHEN v_n = 0 THEN NULL ELSE coalesce(v_masa.acilis_zamani,
        floor(extract(epoch FROM clock_timestamp())*1000)::bigint) END,now(),v_beklenen+1)
    ON CONFLICT(id) DO UPDATE SET sepet=excluded.sepet,odeme_tipi=excluded.odeme_tipi,
      nakit_tutari=excluded.nakit_tutari,kart_tutari=excluded.kart_tutari,
      indirim=excluded.indirim,"not"=excluded."not",acilis_zamani=excluded.acilis_zamani,
      updated_at=excluded.updated_at,surum=excluded.surum
    RETURNING * INTO v_masa;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Masa kaydedilemedi; yazma yetkisini kontrol edin.';
    END IF;
    v_sonuc := jsonb_build_object('adisyon',to_jsonb(v_masa));

  ELSIF p_tur IN ('satis','satis_sil') THEN
    v_islem := nullif(p_veri->>'islemId','')::bigint;
    v_surum := 1;
    v_tarih := to_char(clock_timestamp() AT TIME ZONE 'Europe/Istanbul','DD.MM.YYYY HH24:MI:SS');
    v_platform := CASE WHEN nullif(p_veri->>'adisyonId','') IS NULL THEN 'Sokak Satışı' ELSE 'Dükkân' END;
    v_adisyon := '';
    IF v_islem IS NOT NULL THEN
      SELECT max(surum),coalesce(sum(nakit_tutari),0),min(tarih),min(platform),min(adisyon)
        INTO v_surum,v_eski_nakit,v_tarih,v_platform,v_adisyon
        FROM public.satislar WHERE islem_id=v_islem;
      IF v_surum IS NULL OR v_surum IS DISTINCT FROM (p_veri->>'beklenenSurum')::bigint THEN
        RAISE EXCEPTION USING ERRCODE='40001', MESSAGE='Satış değişmiş veya silinmiş. Güncel kaydı yeniden yükleyin.';
      END IF;
      v_surum := v_surum + 1;
    ELSIF p_tur = 'satis_sil' THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Silinecek satış numarası eksik.';
    ELSE
      SELECT greatest(floor(extract(epoch FROM clock_timestamp())*1000)::bigint,
        coalesce(max(islem_id),0)+1) INTO v_islem FROM public.satislar;
    END IF;

    IF p_tur = 'satis_sil' THEN
      DELETE FROM public.satislar WHERE islem_id=v_islem;
      GET DIAGNOSTICS v_sayac = ROW_COUNT;
      IF v_sayac = 0 THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Satış silme yetkisi yok.'; END IF;
      v_delta := -v_eski_nakit;
      v_sonuc := jsonb_build_object('islemId',v_islem,'silindi',true);
    ELSE
      v_nakit := public.aristo_v2_kurus(p_veri->>'nakit');
      v_kart := public.aristo_v2_kurus(p_veri->>'kart');
      v_toplam := v_ara-v_indirim;
      IF v_nakit+v_kart <> v_toplam OR public.aristo_v2_kurus(p_veri->>'toplam') <> v_toplam THEN
        RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Nakit ve kart toplamı ödenecek tutarla aynı olmalı.';
      END IF;
      v_odeme := CASE WHEN v_nakit>0 AND v_kart>0 THEN 'Nakit + Kredi Kartı'
        WHEN v_nakit>0 THEN 'Nakit' ELSE 'Kredi Kartı' END;
      v_adisyon_id := nullif(p_veri->>'adisyonId','');
      IF v_adisyon_id IS NOT NULL THEN
        IF nullif(p_veri->>'islemId','') IS NOT NULL THEN
          RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Geçmiş satış düzenlenirken açık masa değiştirilemez.';
        END IF;
        SELECT * INTO v_masa FROM public.acik_adisyonlar WHERE id=v_adisyon_id FOR UPDATE;
        IF NOT FOUND OR v_masa.surum IS DISTINCT FROM (p_veri->>'adisyonSurum')::bigint
          OR v_masa.sepet <> v_sepet
          OR public.aristo_v2_kurus(v_masa.indirim) <> v_indirim THEN
          RAISE EXCEPTION USING ERRCODE='40001',MESSAGE='Masa içeriği değişti veya henüz kaydolmadı. Güncel masayı kontrol edin.';
        END IF;
        v_adisyon := v_masa.ad;
      END IF;

      -- En büyük kalan yöntemi: indirim ve ödemelerde kuruş kaybolmaz.
      v_indirimler := array_fill(0::bigint,ARRAY[v_n]);
      v_netler := array_fill(0::bigint,ARRAY[v_n]);
      v_nakitler := array_fill(0::bigint,ARRAY[v_n]);
      v_kalan := v_indirim;
      FOR v_i IN 1..v_n LOOP
        IF v_ara>0 THEN v_indirimler[v_i] := floor(v_baz[v_i]::numeric*v_indirim/v_ara)::bigint; END IF;
        v_kalan := v_kalan-v_indirimler[v_i];
      END LOOP;
      IF v_kalan>0 THEN
        FOR v_i IN SELECT i FROM generate_series(1,v_n) AS s(i)
          ORDER BY mod(v_baz[i]::numeric*v_indirim,v_ara) DESC,i LIMIT v_kalan LOOP
          v_indirimler[v_i] := v_indirimler[v_i]+1;
        END LOOP;
      END IF;
      v_kalan := v_nakit;
      FOR v_i IN 1..v_n LOOP
        v_netler[v_i] := v_baz[v_i]-v_indirimler[v_i];
        IF v_toplam>0 THEN v_nakitler[v_i] := floor(v_netler[v_i]::numeric*v_nakit/v_toplam)::bigint; END IF;
        v_kalan := v_kalan-v_nakitler[v_i];
      END LOOP;
      IF v_kalan>0 THEN
        FOR v_i IN SELECT i FROM generate_series(1,v_n) AS s(i)
          ORDER BY mod(v_netler[i]::numeric*v_nakit,v_toplam) DESC,i LIMIT v_kalan LOOP
          v_nakitler[v_i] := v_nakitler[v_i]+1;
        END LOOP;
      END IF;

      SELECT greatest(floor(extract(epoch FROM clock_timestamp())*1000)::bigint,
        coalesce(max(id),0)+1) INTO v_satir_id FROM public.satislar;
      IF nullif(p_veri->>'islemId','') IS NOT NULL THEN
        DELETE FROM public.satislar WHERE islem_id=v_islem;
        GET DIAGNOSTICS v_sayac = ROW_COUNT;
        IF v_sayac=0 THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Satış düzenleme yetkisi yok.'; END IF;
      END IF;
      FOR v_i IN 1..v_n LOOP
        v_satir := v_sepet->(v_i-1);
        INSERT INTO public.satislar
          (id,islem_id,satir_id,adisyon,tarih,urun,kategori,platform,odeme_tipi,adet,
           birim_fiyat,extra,ekmek,indirim,toplam,nakit_tutari,kart_tutari,online_tutari,"not",surum)
        VALUES (v_satir_id+v_i-1,v_islem,(v_satir->>'satirId')::bigint,v_adisyon,v_tarih,
          v_satir->>'urun',coalesce(v_satir->>'kategori',''),v_platform,v_odeme,
          (v_satir->>'adet')::integer,(v_satir->>'birimFiyat')::numeric,
          coalesce((v_satir->>'extra')::numeric,0),v_satir->>'ekmek',
          v_indirimler[v_i]::numeric/100,v_netler[v_i]::numeric/100,
          v_nakitler[v_i]::numeric/100,(v_netler[v_i]-v_nakitler[v_i])::numeric/100,0,
          coalesce(p_veri->>'not',''),v_surum);
      END LOOP;
      IF v_adisyon_id IS NOT NULL THEN
        UPDATE public.acik_adisyonlar SET sepet='[]'::jsonb,odeme_tipi='Kredi Kartı',
          nakit_tutari='0',kart_tutari='0',indirim='0',"not"='',acilis_zamani=NULL,
          updated_at=now(),surum=surum+1 WHERE id=v_adisyon_id RETURNING * INTO v_masa;
        IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Masa kapatma yetkisi yok.'; END IF;
        v_sonuc := jsonb_build_object('adisyon',to_jsonb(v_masa));
      END IF;
      SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.id),'[]'::jsonb)
        INTO v_satirlar FROM public.satislar s WHERE islem_id=v_islem;
      IF jsonb_array_length(v_satirlar) <> v_n THEN
        RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Satış kayıtları doğrulanamadı.';
      END IF;
      v_delta := v_nakit::numeric/100-v_eski_nakit;
      v_sonuc := v_sonuc || jsonb_build_object('islemId',v_islem,'satislar',v_satirlar);
    END IF;

  ELSIF p_tur IN ('gider','gider_sil') THEN
    v_islem := nullif(p_veri->>'id','')::bigint;
    v_surum := 1;
    IF v_islem IS NOT NULL THEN
      SELECT * INTO v_gider FROM public.giderler WHERE id=v_islem FOR UPDATE;
      IF NOT FOUND OR v_gider.surum IS DISTINCT FROM (p_veri->>'beklenenSurum')::bigint THEN
        RAISE EXCEPTION USING ERRCODE='40001',MESSAGE='Gider değişmiş veya silinmiş. Güncel kaydı yeniden yükleyin.';
      END IF;
      v_eski_nakit := CASE WHEN v_gider.odeme_tipi='Nakit' THEN v_gider.tutar ELSE 0 END;
      v_surum := v_gider.surum+1;
    ELSIF p_tur='gider_sil' THEN
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Silinecek gider numarası eksik.';
    ELSE
      SELECT greatest(floor(extract(epoch FROM clock_timestamp())*1000)::bigint,
        coalesce(max(id),0)+1) INTO v_islem FROM public.giderler;
    END IF;
    IF p_tur='gider_sil' THEN
      DELETE FROM public.giderler WHERE id=v_islem;
      GET DIAGNOSTICS v_sayac=ROW_COUNT;
      IF v_sayac=0 THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Gider silme yetkisi yok.'; END IF;
      v_delta := v_eski_nakit;
      v_sonuc := jsonb_build_object('id',v_islem,'silindi',true);
    ELSE
      v_toplam := public.aristo_v2_kurus(p_veri->>'tutar');
      IF v_toplam=0 OR nullif(p_veri->>'kategori','') IS NULL
        OR p_veri->>'odeme_tipi' IS NULL OR p_veri->>'odeme_tipi' NOT IN ('Nakit','Kart','Banka') THEN
        RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Gider tutarı, kategorisi veya ödeme tipi geçersiz.';
      END IF;
      INSERT INTO public.giderler (id,tarih,kategori,odeme_tipi,tutar,aciklama,surum)
        VALUES (v_islem,coalesce(v_gider.tarih,now()),p_veri->>'kategori',p_veri->>'odeme_tipi',
          v_toplam::numeric/100,coalesce(p_veri->>'aciklama',''),v_surum)
        ON CONFLICT(id) DO UPDATE SET kategori=excluded.kategori,odeme_tipi=excluded.odeme_tipi,
          tutar=excluded.tutar,aciklama=excluded.aciklama,surum=excluded.surum
        RETURNING * INTO v_gider;
      IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Gider kaydedilemedi.'; END IF;
      v_delta := v_eski_nakit-CASE WHEN v_gider.odeme_tipi='Nakit' THEN v_gider.tutar ELSE 0 END;
      v_sonuc := jsonb_build_object('gider',to_jsonb(v_gider));
    END IF;

  ELSIF p_tur='kasa' THEN
    v_toplam := public.aristo_v2_kurus(p_veri->>'tutar');
    IF p_veri->>'tip'='acilis' THEN
      IF v_kasa.surum IS DISTINCT FROM (p_veri->>'beklenenSurum')::bigint THEN
        RAISE EXCEPTION USING ERRCODE='40001',MESSAGE='Kasa bakiyesi değişti. Güncel bakiyeyi yeniden yükleyin.';
      END IF;
      v_delta := v_toplam::numeric/100-v_kasa.tutar;
    ELSIF p_veri->>'tip' IN ('ekle','cikar') AND v_toplam>0 THEN
      v_delta := (v_toplam::numeric/100)*CASE WHEN p_veri->>'tip'='ekle' THEN 1 ELSE -1 END;
    ELSE
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Kasa işlemi veya tutarı geçersiz.';
    END IF;
  END IF;

  IF p_tur<>'adisyon' THEN
    UPDATE public.kasa SET tutar=tutar+v_delta,surum=surum+1,updated_at=now()
      WHERE id=1 RETURNING * INTO v_kasa;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Kasa güncelleme yetkisi yok. İşlem geri alındı.';
    END IF;
  END IF;
  v_sonuc := v_sonuc || jsonb_build_object('kasa',to_jsonb(v_kasa),'kasaFarki',v_delta);
  INSERT INTO public.aristo_islem_sonuclari_v2(id,kullanici_id,tur,veri,sonuc)
    VALUES(p_istek,v_kullanici,p_tur,p_veri,v_sonuc);
  RETURN v_sonuc;
END $$;

REVOKE ALL ON FUNCTION public.aristo_yaz_v2(uuid,text,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.aristo_v2_kurus(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.aristo_v2_yazma_korumasi() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aristo_yaz_v2(uuid,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aristo_v2_kurus(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
