-- Aristo tek yönetici hesabı ve RLS güvenliği — 30.08.2026
-- Çalıştırmadan önce auth.users sorgusunda yalnızca doğru Aristo hesabının
-- bulunduğunu doğrulayın. Bu dosya veri kayıtlarını silmez veya değiştirmez.
BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM auth.users WHERE deleted_at IS NULL) <> 1 THEN
    RAISE EXCEPTION 'Kurulum durduruldu: auth.users içinde tam olarak bir etkin hesap bulunmalı.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.aristo_yoneticiler (
  kullanici_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.aristo_yoneticiler (kullanici_id)
SELECT id FROM auth.users WHERE deleted_at IS NULL
ON CONFLICT (kullanici_id) DO NOTHING;

REVOKE ALL ON public.aristo_yoneticiler FROM PUBLIC, anon, authenticated;
ALTER TABLE public.aristo_yoneticiler ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.aristo_yonetici_mi()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.aristo_yoneticiler
    WHERE kullanici_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.aristo_yonetici_mi() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aristo_yonetici_mi() TO authenticated;

DO $$
DECLARE
  t text;
  p record;
  tablolar constant text[] := ARRAY[
    'urunler','malzemeler','receteler','acik_adisyonlar','satislar','giderler',
    'tahsilatlar','kasa','mudo','cari','takvim','notlar','rehber','ayarlar',
    'aristo_islem_sonuclari_v2'
  ];
BEGIN
  FOREACH t IN ARRAY tablolar LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE EXCEPTION 'Gerekli tablo bulunamadı: %', t;
    END IF;

    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY aristo_yonetici_erisim ON public.%I '
      'FOR ALL TO authenticated '
      'USING (public.aristo_yonetici_mi()) '
      'WITH CHECK (public.aristo_yonetici_mi())',
      t
    );
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT
  public.aristo_yonetici_mi() AS bu_hesap_yonetici,
  (SELECT count(*) FROM public.aristo_yoneticiler) AS yonetici_sayisi;
