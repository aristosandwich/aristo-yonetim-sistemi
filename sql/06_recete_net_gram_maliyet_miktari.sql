-- Net gram ile maliyette kullanılan adet/porsiyonu ayırır — 30.08.2026
BEGIN;

ALTER TABLE public.receteler
  ADD COLUMN IF NOT EXISTS maliyet_miktari numeric(10,4) NOT NULL DEFAULT 1;

ALTER TABLE public.receteler
  DROP CONSTRAINT IF EXISTS receteler_maliyet_miktari_kontrol;
ALTER TABLE public.receteler
  ADD CONSTRAINT receteler_maliyet_miktari_kontrol
  CHECK (maliyet_miktari > 0 AND maliyet_miktari <= 100000);

CREATE OR REPLACE FUNCTION public.aristo_recete_satiri_guncelle_v2(
  p_recete_id bigint,
  p_malzeme_id bigint,
  p_eski_net_gram numeric,
  p_eski_maliyet_miktari numeric,
  p_eski_kalori numeric,
  p_eski_birim_fiyat numeric,
  p_eski_direkt_fiyat numeric,
  p_eski_fiyat_tipi text,
  p_yeni_net_gram numeric,
  p_yeni_maliyet_miktari numeric,
  p_yeni_kalori numeric,
  p_yeni_fiyat numeric,
  p_yeni_fiyat_tipi text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_recete public.receteler%ROWTYPE;
  v_malzeme public.malzemeler%ROWTYPE;
  v_birim_fiyat numeric;
  v_direkt_fiyat numeric;
BEGIN
  IF NOT public.aristo_yonetici_mi() THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Reçete düzenleme yetkisi bulunamadı.';
  END IF;
  IF p_yeni_net_gram IS NULL OR p_yeni_net_gram <= 0 OR p_yeni_net_gram > 100000
     OR p_yeni_maliyet_miktari IS NULL OR p_yeni_maliyet_miktari <= 0 OR p_yeni_maliyet_miktari > 100000
     OR p_yeni_kalori IS NULL OR p_yeni_kalori < 0 OR p_yeni_kalori > 100000
     OR p_yeni_fiyat IS NULL OR p_yeni_fiyat < 0 OR p_yeni_fiyat > 9999999999.99
     OR p_yeni_fiyat_tipi NOT IN ('kg','adet','direkt') THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Gram, maliyet miktarı, fiyat, birim veya kalori geçersiz.';
  END IF;

  SELECT * INTO v_recete FROM public.receteler WHERE id=p_recete_id FOR UPDATE;
  IF NOT FOUND OR v_recete.gram IS DISTINCT FROM p_eski_net_gram
     OR v_recete.maliyet_miktari IS DISTINCT FROM p_eski_maliyet_miktari
     OR v_recete.porsiyon_kalori IS DISTINCT FROM p_eski_kalori THEN
    RAISE EXCEPTION USING ERRCODE='40001', MESSAGE='Reçete başka bir ekranda değişti. Sayfayı yenileyin.';
  END IF;

  SELECT * INTO v_malzeme FROM public.malzemeler WHERE id=p_malzeme_id FOR UPDATE;
  IF NOT FOUND OR v_malzeme.birim_fiyat IS DISTINCT FROM p_eski_birim_fiyat
     OR v_malzeme.direkt_fiyat IS DISTINCT FROM p_eski_direkt_fiyat
     OR v_malzeme.fiyat_tipi IS DISTINCT FROM p_eski_fiyat_tipi THEN
    RAISE EXCEPTION USING ERRCODE='40001', MESSAGE='Malzeme fiyatı başka bir ekranda değişti. Sayfayı yenileyin.';
  END IF;

  IF p_yeni_fiyat_tipi='direkt' THEN
    v_birim_fiyat := v_malzeme.birim_fiyat;
    v_direkt_fiyat := p_yeni_fiyat;
  ELSE
    v_birim_fiyat := p_yeni_fiyat;
    v_direkt_fiyat := 0;
  END IF;

  UPDATE public.receteler
    SET gram=p_yeni_net_gram,
        maliyet_miktari=p_yeni_maliyet_miktari,
        porsiyon_kalori=p_yeni_kalori
    WHERE id=p_recete_id
    RETURNING * INTO v_recete;

  UPDATE public.malzemeler
    SET birim_fiyat=v_birim_fiyat,
        direkt_fiyat=v_direkt_fiyat,
        fiyat_tipi=p_yeni_fiyat_tipi
    WHERE id=p_malzeme_id
    RETURNING * INTO v_malzeme;

  RETURN jsonb_build_object('recete',to_jsonb(v_recete),'malzeme',to_jsonb(v_malzeme));
END $$;

REVOKE ALL ON FUNCTION public.aristo_recete_satiri_guncelle_v2(
  bigint,bigint,numeric,numeric,numeric,numeric,numeric,text,numeric,numeric,numeric,numeric,text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aristo_recete_satiri_guncelle_v2(
  bigint,bigint,numeric,numeric,numeric,numeric,numeric,text,numeric,numeric,numeric,numeric,text
) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT to_regprocedure(
  'public.aristo_recete_satiri_guncelle_v2(bigint,bigint,numeric,numeric,numeric,numeric,numeric,text,numeric,numeric,numeric,numeric,text)'
) IS NOT NULL AS net_gram_ve_maliyet_miktari_hazir;
