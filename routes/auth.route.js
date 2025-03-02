import { Router } from "express";
import { signUp, signIn, signOut } from "../controller/auth.controller";

const router = Router();

router.post("/sign-up", signUp);
router.post("/login", signIn);
router.post("/logout", signOut);



export default router;