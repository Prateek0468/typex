// 'use client'

// import { calculateWPM } from "@/lib/utils";
// import { AnimatePresence, motion } from "framer-motion";
// import { useEffect, useRef, useState } from "react";

// function TypingTest({ text }: { text: string }) {
//   const [userInput, setUserInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [isCompleted, setIsCompleted] = useState(false);
//   const [startTime, setStartTime] = useState<number | null>(null);
//   const [endTime, setEndTime] = useState<number | null>(null);
//   const [accuracy, setAccuracy] = useState<number>(0);
//   const [wpm, setWpm] = useState<number>(0);
//   const [liveWpm, setLiveWpm] = useState<number>(0);
//   const [currentPosition, setCurrentPosition] = useState(0);
//   const wpmIntervalRef = useRef<NodeJS.Timeout | null>(null);
//   const [cursorPosition, setCursorPosition] = useState({
//     left: 0,
//     top: 0,
//     height: 0,
//   });
//   const inputRef = useRef<HTMLInputElement>(null);

//   const initGame = () => {
//     setIsTyping(true);
//     setIsCompleted(false);
//     setUserInput("");
//     setStartTime(Date.now());
//     setEndTime(null);
//     setAccuracy(0);
//     setWpm(0);
//     setCursorPosition({
//       left: 0,
//       top: 0,
//       height: 0,
//     });
//     setCurrentPosition(0);
//   }

//   useEffect(() => {
//     if (isTyping && !isCompleted) {
//       // Clear any existing interval
//       if (wpmIntervalRef.current) {
//         clearInterval(wpmIntervalRef.current)
//       }

//       // Update WPM every second
//       wpmIntervalRef.current = setInterval(() => {
//         setLiveWpm(calculateWPM(startTime, endTime, userInput))
//       }, 1000)

//       // Calculate initial WPM
//       setLiveWpm(calculateWPM(startTime, endTime, userInput))
//     }

//     return () => {
//       if (wpmIntervalRef.current) {
//         clearInterval(wpmIntervalRef.current)
//       }
//     }
//   }, [isTyping, isCompleted, userInput, startTime, endTime])

//   // Handle keyboard input
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     // Ignore modifier keys and special keys
//     if (
//       e.ctrlKey ||
//       e.altKey ||
//       e.metaKey ||
//       e.key === "Shift" ||
//       e.key === "Control" ||
//       e.key === "Alt" ||
//       e.key === "Meta" ||
//       e.key === "Tab" ||
//       e.key === "CapsLock" ||
//       e.key === "Escape"
//     ) {
//       return
//     }

//     // Prevent default behavior for most keys
//     if (e.key !== "Backspace") {
//       e.preventDefault()
//     }

//     // Start timer on first keystroke
//     if (!isTyping && !startTime) {
//       setStartTime(Date.now())
//       setIsTyping(true)
//     }

//     // Handle backspace
//     if (e.key === "Backspace" && currentPosition > 0) {
//       e.preventDefault()
//       setCurrentPosition(currentPosition - 1)
//       setUserInput(userInput.slice(0, -1))
//       return
//     }

//     // Ignore if we're at the end of the quote
//     if (currentPosition >= text.length) {
//       return
//     }

//     // Handle character input
//     if (e.key.length === 1) {
//       const newUserInput = userInput + e.key
//       setUserInput(newUserInput)
//       setCurrentPosition(currentPosition + 1)

//       // Calculate accuracy
//       let correctChars = 0
//       for (let i = 0; i < newUserInput.length; i++) {
//         if (i < text.length && newUserInput[i] === text[i]) {
//           correctChars++
//         }
//       }
//       const accuracyPercent = newUserInput.length > 0 ? Math.floor((correctChars / newUserInput.length) * 100) : 100
//       setAccuracy(accuracyPercent)

//       // Check if quote is completed
//       if (newUserInput === text || currentPosition + 1 >= text.length) {
//         setEndTime(Date.now())
//         setIsCompleted(true)

//         // Set final WPM
//         setWpm(calculateWPM())

//         // Clear interval
//         if (wpmIntervalRef.current) {
//           clearInterval(wpmIntervalRef.current)
//           wpmIntervalRef.current = null
//         }
//       }
//     }
//   }

//   return (
//     <div
//       className="relative font-mono text-xl mx-auto p-4"
//       onKeyDown={handleKeyDown}
//       ref={inputRef}
//     >
//       {text}
//       <AnimatePresence>
//         <motion.div
//           key="cursor"
//           className="absolute bg-foreground"
//           style={{
//             left: `${cursorPosition.left}px`,
//             top: `${cursorPosition.top}px`,
//             height: '1em',
//             width: '2px',
//           }}
//           initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
//           animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
//           exit={{ opacity: 0, x: 20, filter: "blur(4px)" }}
//           transition={{
//             duration: 0.2,
//             // delay: index * 0.05, // Stagger effect
//           }}
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//         />
//       </AnimatePresence>
//     </div>
//   );
// }

// export default TypingTest