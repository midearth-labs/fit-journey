import {
  Activity,
  Layers,
  StretchHorizontal, // stretch-horizontal
  ShieldCheck, // shield-check
  Scale, // balance - using Scale as replacement since Balance doesn't exist
  Brain,
  Heart,
  Dumbbell,
  House,
  Settings,
  SlidersVertical,
  Shirt,
  Users,
  Wind,
  Move,
  TrendingUp, // trending-up
  User,
  TriangleAlert, // alert-triangle
  Settings2, // settings-2
  Zap,
  Target,
  Calendar,
  Menu,
  ChartColumn, // bar-chart-3
  CircleQuestionMark, // help-circle
  MapPin, // map-pin
  Turtle,
  BookOpen, // book-open
  Hand, // helping-hand - using Hand as replacement since HelpingHand doesn't exist
  Monitor,
  Moon,
  Minimize2, // minimize-2
  Clock,
  Stethoscope,
  Repeat,
  LifeBuoy, // life-buoy
  CalendarDays, // calendar-days
  Shield,
  Smartphone,
  Smile,
  CalendarCheck, // calendar-check
  TrendingDown, // trending-down
  ChartPie, // pie-chart
  Calculator,
  Droplets,
  Search,
  Ruler,
  Circle,
  Star,
  Beef,
  Bomb,
  Handshake,
  Utensils,
  Ear,
  CircleAlert, // alert-circle
  RefreshCw, // refresh-cw
  MessageCircleQuestionMark,
  Weight,
  BriefcaseMedical, // first-aid
} from 'lucide-svelte';

const DynamicIcons = {
  "activity": Activity,
  "layers": Layers,
  "stretch-horizontal": StretchHorizontal,
  "shield-check": ShieldCheck,
  "balance": Scale, // Replaced with Scale since Balance doesn't exist in Lucide
  "brain": Brain,
  "heart": Heart,
  "dumbbell": Dumbbell,
  "leg": Dumbbell,
  "home": House,
  "settings": Settings,
  "sliders": SlidersVertical,
  "shirt": Shirt,
  "users": Users,
  "wind": Wind,
  "move": Move,
  "trending-up": TrendingUp,
  "user": User,
  "alert-triangle": TriangleAlert,
  "settings-2": Settings2,
  "zap": Zap,
  "target": Target,
  "calendar": Calendar,
  "menu": Menu,
  "bar-chart-3": ChartColumn,
  "help-circle": CircleQuestionMark,
  "map-pin": MapPin,
  "turtle": Turtle,
  "book-open": BookOpen,
  "helping-hand": MessageCircleQuestionMark,
  "monitor": Monitor,
  "moon": Moon,
  "minimize-2": Minimize2,
  "clock": Clock,
  "stethoscope": Stethoscope,
  "repeat": Repeat,
  "life-buoy": LifeBuoy,
  "calendar-days": CalendarDays,
  "shield": Shield,
  "smartphone": Smartphone,
  "smile": Smile,
  "calendar-check": CalendarCheck,
  "trending-down": TrendingDown,
  "pie-chart": ChartPie,
  "calculator": Calculator,
  "droplets": Droplets,
  "search": Search,
  "ruler": Ruler,
  "circle": Circle,
  "star": Star,
  "beef": Beef,
  "bomb": Bomb,
  "scale": Weight,
  "handshake": Handshake,
  "utensils": Utensils,
  "ear": Ear,
  "alert-circle": CircleAlert,
  "refresh-cw": RefreshCw,
  "first-aid": BriefcaseMedical,
};

export default DynamicIcons;
