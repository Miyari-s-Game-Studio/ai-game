import {animate, createScope, createSpring, createDraggable} from 'animejs';
import React, {useEffect, useRef} from "react";
import {Dices} from "lucide-react";

export function Dice(props: { d: number, duration: number }) {
  const root = useRef<any | null>(null);
  const scope = useRef<any | null>(null);
  const [diceN, setDiceN] = React.useState('?');
  useEffect(() => {
    scope.current = createScope({root}).add(self => {
      animate(root.current!, {
        rotate: [0, 360],
        ease: 'out(4)',
        duration: props.duration,
        onComplete: () => {
          setDiceN(props.d.toString())
        }
      });
    })
    return () => scope.current?.revert()
  }, []);
  return <>
    <Dices className="w-8 h-8 p-1 border rounded-md" ref={root}/>
    <span className="text-sm font-mono mt-1">{diceN}</span>
  </>
}
