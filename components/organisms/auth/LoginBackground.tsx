import Image from "next/image";

export default function LoginBackground() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 w-full overflow-hidden">
        <Image
          src="/login/vectors/Vector 1.svg"
          alt="Decorative gradient"
          width={1920}
          height={500}
          className="fixed top-0 z-30 h-auto w-full"
          priority
        />
        <Image
          src="/login/vectors/Vector 2.svg"
          alt="Decorative gradient"
          width={1920}
          height={500}
          className="fixed top-0 z-20 h-auto w-full"
        />
        <Image
          src="/login/vectors/Vector 3.svg"
          alt="Decorative gradient"
          width={1920}
          height={500}
          className="fixed top-0 z-10 h-auto w-full"
        />
      </div>

      <div className="pointer-events-none absolute bottom-[-30px] right-0 h-[360px] w-[520px] overflow-hidden">
        <Image
          src="/login/vectors/Vector 4.svg"
          alt="Decorative shape"
          width={520}
          height={360}
          className="absolute bottom-0 right-[-25px] z-30 mr-[-120px] h-auto w-[520px]"
          loading="lazy"
          quality={70}
        />
        <Image
          src="/login/vectors/Vector 5.svg"
          alt="Decorative shape"
          width={520}
          height={360}
          className="absolute bottom-0 right-[-25px] z-20 mr-[-100px] h-auto w-[520px] opacity-50"
          loading="lazy"
          quality={70}
        />
        <Image
          src="/login/vectors/Vector 6.svg"
          alt="Decorative shape"
          width={520}
          height={360}
          className="absolute bottom-0 right-[-25px] z-10 mr-[-80px] h-auto w-[520px] opacity-40"
          loading="lazy"
          quality={70}
        />
      </div>

      <Image
        src="/login/wallet.svg"
        alt="Wallet illustration"
        width={650}
        height={650}
        priority
        className="pointer-events-none absolute left-[1.5vw] top-25 w-[31vw]"
      />
      <Image
        src="/login/mobile.svg"
        alt="Booking illustration"
        width={515}
        height={515}
        loading="lazy"
        sizes="(max-width: 768px) 246px, 515px"
        className="pointer-events-none absolute bottom-[-25px] left-[2vw] w-[35vw]"
      />
      <Image
        src="/login/world.svg"
        alt="World illustration"
        width={332}
        height={332}
        loading="lazy"
        sizes="(max-width: 768px) 166px, 332px"
        className="pointer-events-none absolute -top-2 right-[39%] w-[30vw]"
      />
      <Image
        src="/login/airport.svg"
        alt="Traveler illustration"
        width={320}
        height={320}
        loading="lazy"
        sizes="(max-width: 768px) 160px, 320px"
        className="pointer-events-none absolute -bottom-1 right-[28%] w-[28vw]"
      />
      <Image
        src="/login/travel.svg"
        alt="Group illustration"
        width={480}
        height={500}
        loading="lazy"
        sizes="(max-width: 768px) 240px, 480px"
        className="pointer-events-none absolute right-[2vw] top-[10vh] w-[35vw]"
      />
    </>
  );
}
