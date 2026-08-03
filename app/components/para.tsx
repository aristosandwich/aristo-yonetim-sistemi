type Props = {
  tutar: number;
};

export default function Para({ tutar }: Props) {
  return (
    <>
      {new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(tutar)}
    </>
  );
}