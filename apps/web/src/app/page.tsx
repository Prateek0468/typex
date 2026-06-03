import NavigationCards from "@/components/navigation-cards";
// import TypingTest from "@/components/typing-test";
// import { Button } from "@/components/ui/button";
// import { getRandomText } from "@/lib/utils";
import { Sparkles } from 'lucide-react';
import { CardOptions } from "@/lib/constants";

export default function Home() {

  return (
    <div className="flex flex-col font-michroma">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col justify-center items-center mt-80">
          <div className="flex mb-4 gap-2">
            <Sparkles className="size-12 text-yellow-500 dark:text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              TypeX
            </h1>
          </div>
          <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4">
            Improve your typing speed and accuracy
          </p>
          {/* Update it to the user's creds */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
            Welcome back, <span className="font-bold text-blue-600 dark:text-blue-400">{"Username"}</span>! Your average speed: <span className="font-bold">{0} WPM</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {CardOptions.map(({ href, icon, title, description }) => (
            <NavigationCards key={href} icon={icon} title={title} description={description} href={href} />
          ))}
        </div>
      </div>
    </div>
  );
}
