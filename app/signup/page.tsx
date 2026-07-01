import Link from "next/link";
import { AuthCard } from "@/components/auth-card";

export default function SignupPage() {
  return <AuthCard title="Create account" cta="Signup" extra="Full name" footer={<Link href="/login">Already have an account?</Link>} />;
}
