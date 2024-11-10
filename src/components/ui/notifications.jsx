'use client';

import { Snackbar } from "@mui/joy";
import { BadgeAlert, BadgeCheck, BadgeInfo } from "lucide-react";
import { useState } from "react";

export default function Notification({ open, message, color }) {
    const [anchor, setAnchor] = useState({ vertical: "top", horizontal: "right" })

    return (
        <>
            <Snackbar
                anchorOrigin={anchor}
                open={open}
                key={anchor.vertical + anchor.horizontal}
                variant="soft"
                color={color ? color : "neutral"}
                startDecorator={color === 'success' ? <BadgeCheck /> : color === 'danger' ? <BadgeAlert /> : <BadgeInfo />}
            >
                {message}
            </Snackbar>
        </>
    );
}