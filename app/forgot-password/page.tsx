import Link from "next/link";
import { AuthCard } from "@/components/auth-card";

export default function ForgotPasswordPage() {
  return <AuthCard title="Reset password" cta="Send reset link" footer={<Link href="/otp">Enter OTP instead</Link>} />;
}
