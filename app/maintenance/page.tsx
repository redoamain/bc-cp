import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function page() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <Avatar className="size-12">
            <AvatarImage
              src="https://github.com/redoamain.png"
              className="grayscale"
            />
            <AvatarFallback>redo</AvatarFallback>
          </Avatar>
        </EmptyMedia>
        <EmptyTitle>System Maintenance</EmptyTitle>
        <EmptyDescription>
          The system is currently under maintenance. Please check back later.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
      
      </EmptyContent>
    </Empty>
  );
}
