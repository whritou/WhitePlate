"use client"
import {
  Palette,
  History,
  ChartNoAxesCombined,
  Users,
  Settings,
  ShieldCheck,
} from "lucide-react"
export const hero = "/lovable/hero.jpg"
export const burger = "/lovable/store/burger.jpg"
export const bowl = "/lovable/store/bowl.jpg"
export const burrata = "/lovable/store/burrata.jpg"
export const tools = [
  {
    icon: History,
    title: "Order history",
    text: "Search completed orders, filter the table, export CSV and print an itemized receipt.",
    to: "/history",
    status: "Receipts & exports",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Analytics & kitchen KPIs",
    text: "Compare periods, explore revenue and peak hours, spot top dishes and export the report.",
    to: "/analytics",
    status: "Service insights",
  },
  {
    icon: Users,
    title: "Staff & roles",
    text: "Explore invitations, restaurant access, editable roles, suspension and revocation.",
    to: "/staff",
    status: "Team access",
  },
  {
    icon: Settings,
    title: "Organization & restaurants",
    text: "Manage organization details, restaurant information and notification preferences in one place.",
    to: "/settings",
    status: "Multi-location",
  },
  {
    icon: Palette,
    title: "Theming Studio",
    text: "Choose fonts, colors, imagery, layouts and spacing, with store, checkout and tracking previews.",
    to: "/studio",
    status: "Interactive editor",
  },
  {
    icon: ShieldCheck,
    title: "Accounts & profiles",
    text: "Register with email, confirm your account and log in. Keep your personal profile and account access in one place.",
    to: "/register",
    status: "Personal profiles",
  },
] as const
export const plans = [
  {
    name: "Starter",
    price: 29,
    subtitle: "For an independent restaurant.",
    items: [
      "1 restaurant",
      "3 staff seats",
      "Menu & discount codes",
      "Branded storefront",
      "Order board",
    ],
  },
  {
    name: "Pro",
    price: 79,
    subtitle: "For a growing restaurant team.",
    items: [
      "Up to 3 restaurants",
      "Unlimited staff & roles",
      "Kitchen analytics",
      "Translations & extras",
      "Custom domain",
    ],
    featured: true,
  },
  {
    name: "Scale",
    price: 199,
    subtitle: "For groups and franchises.",
    items: [
      "Unlimited restaurants",
      "Advanced reporting & exports",
      "Full white-labeling",
      "Multiple custom domains",
      "Priority support",
    ],
  },
]
export const faqs = [
  {
    q: "Who is WhitePlate for?",
    a: "Independent restaurants, growing teams and restaurant groups looking for a branded click-and-collect experience and a single workspace for their service.",
  },
  {
    q: "Can I customize the whole customer journey?",
    a: "Yes. Theming Studio brings the same identity to your store, checkout and order tracking, including colors, heading and body fonts, logo, banner, buttons and restaurant information.",
  },
  {
    q: "Can my menu support different languages and dietary needs?",
    a: "Add translations for categories, dishes, options and allergens. Manage allergen labels per dish, multiple photos, extras, availability and discount codes in the menu builder.",
  },
  {
    q: "What tools are included for my team?",
    a: "An order board, completed-order history with exports and receipts, analytics, staff and role management, and organization and restaurant settings.",
  },
  {
    q: "Can I explore WhitePlate before creating an account?",
    a: "Yes. Use the View demo links to explore the workspace and customer experience. Those pages use sample data: they do not accept payments, send staff invitations or place live restaurant orders.",
  },
  {
    q: "Does creating an account start a subscription?",
    a: "No. Creating an account is free and does not charge you or activate a paid plan.",
  },
]
