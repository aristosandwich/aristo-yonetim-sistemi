-- Aristo transaction içi, silmeden birleştiren geri yükleme — 30.08.2026
-- Önce 03_yonetici_guvenligi.sql çalıştırılmalıdır.
BEGIN;

CREATE OR REPLACE FUNCTION public.aristo_yedek_geri_yukle_v1(p_yedek jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tablo text;
  v_tablolar constant text[] := ARRAY[
    'urunler','malzemeler','receteler','acik_adisyonlar','satislar','giderler',
    'tahsilatlar','kasa','mudo','cari','takvim','notlar','rehber','ayarlar',
    'aristo_islem_sonuclari_v2'
  ];
  v_kolonlar text;
  v_secim text;
  v_guncelleme text;
  v_adet integer;
  v_toplam integer := 0;
  v_sonuc jsonb := '{}'::jsonb;
BEGIN
  IF NOT public.aristo_yonetici_mi() THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Geri yükleme yalnızca Aristo yöneticisine açıktır.';
  END IF;
  IF p_yedek IS NULL OR jsonb_typeof(p_yedek) <> 'object' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Yedek tablo yapısı geçersiz.';
  END IF;

  -- Transaction bitene kadar ilgili tablolar değişemez; bir hata olursa hiçbiri yazılmaz.
  FOREACH v_tablo IN ARRAY v_tablolar LOOP
    IF jsonb_typeof(p_yedek->v_tablo) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Yedekte eksik veya geçersiz tablo: ' || v_tablo;
    END IF;
    IF jsonb_array_length(p_yedek->v_tablo) > 100000 THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Tablo kayıt sınırını aşıyor: ' || v_tablo;
    END IF;
    EXECUTE format('LOCK TABLE public.%I IN SHARE ROW EXCLUSIVE MODE', v_tablo);
  END LOOP;

  PERFORM set_config('aristo.yazma_v2', 'acik', true);

  FOREACH v_tablo IN ARRAY v_tablolar LOOP
    SELECT
      string_agg(format('%I', a.attname), ', ' ORDER BY a.attnum),
      string_agg(format('r.%I', a.attname), ', ' ORDER BY a.attnum),
      string_agg(format('%I = excluded.%I', a.attname, a.attname), ', ' ORDER BY a.attnum)
        FILTER (WHERE a.attname <> 'id')
      INTO v_kolonlar, v_secim, v_guncelleme
    FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = format('public.%I', v_tablo)::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND a.attgenerated = '';

    IF v_kolonlar IS NULL OR v_guncelleme IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Tablo şeması geri yüklemeye uygun değil: ' || v_tablo;
    END IF;

    EXECUTE format(
      'INSERT INTO public.%1$I (%2$s) '
      'SELECT %3$s FROM jsonb_populate_recordset(NULL::public.%1$I, $1) r '
      'ON CONFLICT (id) DO UPDATE SET %4$s',
      v_tablo, v_kolonlar, v_secim, v_guncelleme
    ) USING p_yedek->v_tablo;

    GET DIAGNOSTICS v_adet = ROW_COUNT;
    v_toplam := v_toplam + v_adet;
    v_sonuc := v_sonuc || jsonb_build_object(v_tablo, v_adet);
  END LOOP;

  RETURN jsonb_build_object(
    'basarili', true,
    'toplam', v_toplam,
    'tablolar', v_sonuc
  );
END $$;

REVOKE ALL ON FUNCTION public.aristo_yedek_geri_yukle_v1(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aristo_yedek_geri_yukle_v1(jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT
  has_function_privilege(
    'authenticated',
    'public.aristo_yedek_geri_yukle_v1(jsonb)',
    'EXECUTE'
  ) AS geri_yukleme_fonksiyonu_hazir;
