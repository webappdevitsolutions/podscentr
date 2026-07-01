import Link from "next/link";
import { AuthCard } from "@/components/auth-card";

export default function LoginPage() {
  return <AuthCard title="Welcome back" cta="Login" footer={<><Link href="/forgot-password">Forgot password?</Link><Link href="/signup">Create account</Link></>} />;
}
