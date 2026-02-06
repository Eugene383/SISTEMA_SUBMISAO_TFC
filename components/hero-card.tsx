import {ArrowRight} from 'lucide-react'

export default function HeroCard({ title, description }: { title: string; description: string }) {
    return (
      <div 
        className="p-6 rounded-xl border border-foreground/20 dark:border-foreground/10
                   bg-background/80 backdrop-blur-md transition duration-300
                   shadow-lg hover:shadow-xl hover:scale-[1.02]
                   dark:bg-background/60"
      >
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          {title}
          <ArrowRight className="h-4 w-4 text-primary" />
        </h3>
        <p className="text-foreground/70 text-sm">
          {description}
        </p>
      </div>
    );
  }