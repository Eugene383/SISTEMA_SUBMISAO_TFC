import { createClient as createServe } from "../server";
import { createClient } from "../client";




export async function verifySession(){
    const supabase = await  createClient();
    const {data} = await supabase.auth.getSession();
    const user = data.session?.user;
    if(user) return user;
    return null;
}

export async function verifyAuthEmail(){
    const supabase = await createServe();
    const {data,error} = await supabase.auth.getUser();
    if(error) throw  error;
    return data.user?.email ?? null
}