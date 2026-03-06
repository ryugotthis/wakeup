import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/app/lib/auth/getCurrentUserId";

type RouteContext = {
  params: Promise<{
    productId: string;
  }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { bookmarked: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { productId } = await params;

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({
      bookmarked: Boolean(bookmark),
    });
  } catch (error) {
    console.error("[BOOKMARK_GET_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;

    await prisma.bookmark.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    return NextResponse.json({
      message: "Bookmark removed",
      bookmarked: false,
    });
  } catch (error) {
    console.error("[BOOKMARK_DELETE_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
