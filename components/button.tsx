import { Button } from "@/components/ui/button";


export  function Btn(props:any) {
  return <Button {...props} >{props.children}</Button>;
}