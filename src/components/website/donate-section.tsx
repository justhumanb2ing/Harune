import Image from "next/image";
import Link from "next/link";

export default function DonateSection() {
  return (
    <section className="h-[50vh] flex flex-col mx-auto max-w-7xl justify-center items-center">
      <div className="flex flex-col gap-4 items-center p-4">
        <div className="size-26 surface-bevel rounded-4xl">
          <Link href={'https://buymeacoffee.com/justhumanb2ing'}>
            <Image
              src={'https://cdn.harune.me/public/assets/link-provider-icon/buymeacoffee.svg'}
              alt="Buy me a coffee"
              width={120}
              height={120}
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
        <p className="w-fit font-bold text-2xl">Buy me a coffee</p>
      </div>
      
    </section>
  );
}
