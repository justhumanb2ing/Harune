import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { ChevronRightIcon, SparkleIcon } from "lucide-react";
import Link from "next/link";

export default function SectionPage() {
  const sections = [
    {
      href: "/section/profile",
      title: "Profile",
      description: "이름, 핸들, 소개, 프로필 이미지를 관리합니다.",
    },
    {
      href: "/section/social",
      title: "Social",
      description: "소셜 플랫폼별 URL을 저장하고 제거합니다.",
    },
    {
      href: "/section/link",
      title: "Link",
      description: "외부 링크 카드를 추가하고 순서를 정렬합니다.",
    },
    {
      href: "/section/text-box",
      title: "Text",
      description: "링크가 아닌 설명성 콘텐츠 박스를 작성합니다.",
    },
  ];

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Page editor</p>
      </div>

      <div className="flex flex-col gap-2">
        {sections.map((section) => (
          <Item
            key={section.href}
            variant={"default"}
            render={
              <Link
                href={section.href}
                className="rounded-2xl transition-colors bg-background hover:bg-background! py-3.5 shadow-brand"
              >
                <ItemMedia>
                  <SparkleIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{section.title}</ItemTitle>
                  {/* <ItemDescription>{section.description}</ItemDescription> */}
                </ItemContent>
                <ItemActions>
                  <Button size="icon-sm" variant="ghost" className="" aria-label="Invite">
                    <ChevronRightIcon />
                  </Button>
                </ItemActions>
              </Link>
            }
          />
        ))}
      </div>
    </main>
  );
}
