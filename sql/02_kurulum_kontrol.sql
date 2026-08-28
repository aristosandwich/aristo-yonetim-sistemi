-- Sadece okur; veri değiştirmez. 01 dosyasından sonra çalıştırın.
SELECT 'İşlem fonksiyonu' AS kontrol,
  to_regprocedure('public.aristo_yaz_v2(uuid,text,jsonb)') IS NOT NULL AS hazir
UNION ALL
SELECT 'Sürüm sütunları (4 tablo)', count(*) = 4
FROM information_schema.columns
WHERE table_schema='public' AND column_name='surum'
  AND table_name IN ('satislar','acik_adisyonlar','giderler','kasa')
UNION ALL
SELECT 'Yazma korumaları (5 tablo)', count(*) = 5
FROM pg_trigger
WHERE NOT tgisinternal AND tgname='aristo_v2_yazma_korumasi' AND tgenabled='O'
  AND tgrelid IN ('public.satislar'::regclass,'public.acik_adisyonlar'::regclass,
    'public.giderler'::regclass,'public.kasa'::regclass,'public.aristo_islem_sonuclari_v2'::regclass)
UNION ALL
SELECT 'Kasa kaydı', count(*) = 1 FROM public.kasa WHERE id=1;
