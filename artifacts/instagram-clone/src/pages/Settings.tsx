import { useState } from "react";
import { ChevronRight, User, Lock, Bell, Moon, Sun, Info, LogOut, Heart, Shield, Smartphone, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

type Section = {
  title: string;
  items: {
    icon: React.ElementType;
    label: string;
    sublabel?: string;
    action?: () => void;
    toggle?: boolean;
    toggled?: boolean;
    onToggle?: () => void;
    danger?: boolean;
    href?: string;
  }[];
};

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? "bg-primary" : "bg-border"}`}
      data-testid="toggle-switch"
    >
      <motion.div
        layout
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
        animate={{ left: on ? "calc(100% - 1.375rem)" : "0.125rem" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  const toggleDark = () => {
    setDarkMode((d) => {
      const next = !d;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const sections: Section[] = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit profile", sublabel: "Update your name, bio and photo", href: "/profile?edit=true" },
        { icon: Lock, label: "Change password", sublabel: "Keep your account secure" },
        { icon: Smartphone, label: "Connected devices", sublabel: "Manage where you're logged in" },
      ],
    },
    {
      title: "Privacy",
      items: [
        {
          icon: Shield,
          label: "Read receipts",
          sublabel: "Let each other see when messages are read",
          toggle: true,
          toggled: readReceipts,
          onToggle: () => setReadReceipts((v) => !v),
        },
        { icon: Lock, label: "Account privacy", sublabel: "Private — only visible to each other" },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Push notifications",
          sublabel: "Get notified when she posts or messages",
          toggle: true,
          toggled: notifications,
          onToggle: () => setNotifications((v) => !v),
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          icon: darkMode ? Moon : Sun,
          label: "Dark mode",
          sublabel: darkMode ? "Currently dark" : "Currently light",
          toggle: true,
          toggled: darkMode,
          onToggle: toggleDark,
        },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help & FAQ" },
        { icon: Info, label: "About Grova", sublabel: "Version 1.0 — Built just for two" },
        { icon: Heart, label: "Made with love", sublabel: "Just for you two ♥" },
      ],
    },
    {
      title: "",
      items: [
        { icon: LogOut, label: "Log out", danger: true },
      ],
    },
  ];

  return (
    <div className="max-w-[600px] mx-auto pb-20 md:pb-6">
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="divide-y divide-border">
        {sections.map((section, si) => (
          <div key={si} className="py-2">
            {section.title && (
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            {section.items.map((item, ii) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={ii}
                  whileTap={{ scale: 0.99 }}
                  onClick={item.toggle ? undefined : (item.onToggle ?? item.action)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/40 transition-colors cursor-pointer ${
                    item.danger ? "text-destructive" : "text-foreground"
                  }`}
                  data-testid={`setting-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.danger ? "bg-destructive/10" : "bg-secondary"
                  }`}>
                    <Icon className={`w-[18px] h-[18px] ${item.danger ? "text-destructive" : "text-muted-foreground"}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.danger ? "text-destructive" : ""}`}>{item.label}</p>
                    {item.sublabel && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
                    )}
                  </div>
                  {item.toggle ? (
                    <ToggleSwitch on={item.toggled!} onToggle={item.onToggle!} />
                  ) : (
                    !item.danger && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
