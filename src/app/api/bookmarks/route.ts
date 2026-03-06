import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/app/lib/auth/getCurrentUserId";

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const productId = body?.productId as string | undefined;

    if (!productId) {
      return NextResponse.json(
        { message: "productId is required" },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 },
      );
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
      select: {
        id: true,
        userId: true,
        productId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Bookmarked",
        bookmarked: true,
        bookmark,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[BOOKMARK_POST_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
