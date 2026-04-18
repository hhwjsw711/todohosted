"use client";

import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import type { Id } from "../../convex/_generated/dataModel";
import { Editor } from "./Editor";

type TipTapEditorProps = {
  pageId?: Id<"pages">;
};

export function TipTapEditor({ pageId }: TipTapEditorProps) {
  const roomId = pageId ? `shared-doc-${pageId}` : "shared-doc";

  return (
    <LiveblocksProvider publicApiKey="pk_dev_u9BJyGq_76XrpPT-W-Ab6BrWI4RGGg6q39GEZnZdDZNKJ4ZLQGNgQkbwMMLSfXV5">
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>加载中...</div>}>
          <Editor pageId={pageId} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
