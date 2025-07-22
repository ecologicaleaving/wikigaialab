import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration",
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({
    error: "Functionality not available during authentication migration", 
    message: "Database functionality temporarily disabled"
  }, { status: 501 });
}
