import Image from "next/image";
import { notFound } from "next/navigation";
import { BlogGrid } from "@/components/Sections";
import { blogs } from "@/data/products";

export function generateStaticParams() {
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export default async function BlogDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = blogs.find((item) => item.slug === slug);
  if (!blog) notFound();
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-accent">{blog.category}</p>
      <h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">{blog.title}</h1>
      <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-[2rem] shadow-luxury">
        <Image src={blog.image} alt={blog.title} fill priority className="object-cover" />
      </div>
      <div className="mt-10 grid gap-6 text-lg leading-8 text-neutral-700 dark:text-neutral-300">
        <p>{blog.excerpt}</p>
        <p>Premium commerce works best when it disappears into a considered rhythm: clear product storytelling, useful controls, fast feedback, and confident visual hierarchy.</p>
        <p>Podscentra uses editorial product pages, refined filters, persistent cart state, and a warmer recommendation layer to help shoppers make decisions without friction.</p>
      </div>
      <div className="mt-10 rounded-3xl bg-white p-6 dark:bg-white/5">
        <h2 className="text-2xl font-black">Comments</h2>
        <textarea placeholder="Share your thought" className="focus-ring mt-4 min-h-28 w-full rounded-2xl border border-black/10 bg-transparent p-4 dark:border-white/10" />
      </div>
      <div className="mt-12">
        <h2 className="mb-6 text-3xl font-black">Related blogs</h2>
        <BlogGrid />
      </div>
    </article>
  );
}
