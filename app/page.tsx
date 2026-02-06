
import { Hero } from "@/components/hero";



export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      	<div className="flex-1 w-full flex flex-col gap-12 items-center">
      	  	<div className="w-full justify-center backdrop-blur-2xl backdrop-filter  flex flex-1 items-center px-5">
      	  	  <Hero />
      	  	</div>
      	</div>
    </main>
  );
}
