/**
 * Centralized SVG Icon Adapter for Weave365 B2B
 * Powered by @heroicons/react (24/outline) with pixel-exact prop compatibility
 * Supports size={...}, strokeWidth={...}, className, and inline styles seamlessly.
 */
import React from 'react';
import * as HeroIcons from '@heroicons/react/24/outline';

export function wrapIcon(IconComponent, displayName) {
  if (!IconComponent) {
    throw new Error(`IconComponent is undefined for ${displayName}`);
  }
  const Comp = React.forwardRef(function WrappedIcon(
    { size, width, height, className = '', style, strokeWidth, ...props },
    ref
  ) {
    const finalW = width || size || 24;
    const finalH = height || size || 24;
    const finalStyle = size
      ? { width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }
      : { flexShrink: 0, ...style };

    return (
      <IconComponent
        ref={ref}
        width={finalW}
        height={finalH}
        className={className}
        style={finalStyle}
        strokeWidth={strokeWidth || 1.5}
        aria-hidden="true"
        {...props}
      />
    );
  });
  Comp.displayName = displayName || IconComponent.displayName || 'Icon';
  return Comp;
}

export function createCustomSvg(svgChildren, viewBox = '0 0 24 24', displayName = 'CustomIcon', defaultFill = 'none', defaultStroke = 'currentColor') {
  const Comp = React.forwardRef(function CustomIcon(
    { size, width, height, className = '', style, strokeWidth, ...props },
    ref
  ) {
    const finalW = width || size || 24;
    const finalH = height || size || 24;
    const finalStyle = size
      ? { width: `${size}px`, height: `${size}px`, flexShrink: 0, ...style }
      : { flexShrink: 0, ...style };

    return (
      <svg
        ref={ref}
        viewBox={viewBox}
        width={finalW}
        height={finalH}
        className={className}
        style={finalStyle}
        fill={defaultFill}
        stroke={defaultStroke}
        strokeWidth={strokeWidth || (defaultStroke === 'currentColor' ? 1.5 : undefined)}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {svgChildren}
      </svg>
    );
  });
  Comp.displayName = displayName;
  return Comp;
}

// Brand / Social SVGs
export const Facebook = createCustomSvg(
  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
  '0 0 24 24',
  'Facebook',
  'currentColor',
  'none'
);

export const Instagram = createCustomSvg(
  <>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </>,
  '0 0 24 24',
  'Instagram',
  'none',
  'currentColor'
);

export const Linkedin = createCustomSvg(
  <>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </>,
  '0 0 24 24',
  'Linkedin',
  'none',
  'currentColor'
);

export const Youtube = createCustomSvg(
  <>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </>,
  '0 0 24 24',
  'Youtube',
  'none',
  'currentColor'
);

export const Github = createCustomSvg(
  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />,
  '0 0 24 24',
  'Github',
  'none',
  'currentColor'
);

// Heroicons Mapped Components
export const Activity = wrapIcon(HeroIcons.ChartBarSquareIcon, 'Activity');
export const AlertCircle = wrapIcon(HeroIcons.ExclamationCircleIcon, 'AlertCircle');
export const AlertTriangle = wrapIcon(HeroIcons.ExclamationTriangleIcon, 'AlertTriangle');
export const AlignCenter = wrapIcon(HeroIcons.Bars3Icon, 'AlignCenter');
export const AlignLeft = wrapIcon(HeroIcons.Bars3BottomLeftIcon, 'AlignLeft');
export const AlignRight = wrapIcon(HeroIcons.Bars3BottomRightIcon, 'AlignRight');
export const ArrowDown = wrapIcon(HeroIcons.ArrowDownIcon, 'ArrowDown');
export const ArrowLeft = wrapIcon(HeroIcons.ArrowLeftIcon, 'ArrowLeft');
export const ArrowRight = wrapIcon(HeroIcons.ArrowRightIcon, 'ArrowRight');
export const ArrowUpDown = wrapIcon(HeroIcons.ArrowsUpDownIcon, 'ArrowUpDown');
export const ArrowUpRight = wrapIcon(HeroIcons.ArrowUpRightIcon, 'ArrowUpRight');
export const Award = wrapIcon(HeroIcons.TrophyIcon, 'Award');
export const BadgeCheck = wrapIcon(HeroIcons.CheckBadgeIcon, 'BadgeCheck');
export const BadgePercent = wrapIcon(HeroIcons.TagIcon, 'BadgePercent');
export const Bell = wrapIcon(HeroIcons.BellIcon, 'Bell');
export const BookOpen = wrapIcon(HeroIcons.BookOpenIcon, 'BookOpen');
export const Bookmark = wrapIcon(HeroIcons.BookmarkIcon, 'Bookmark');
export const Bot = wrapIcon(HeroIcons.CpuChipIcon, 'Bot');
export const Box = wrapIcon(HeroIcons.ArchiveBoxIcon, 'Box');
export const Boxes = wrapIcon(HeroIcons.Square3Stack3DIcon, 'Boxes');
export const Briefcase = wrapIcon(HeroIcons.BriefcaseIcon, 'Briefcase');
export const Building = wrapIcon(HeroIcons.BuildingOfficeIcon, 'Building');
export const Building2 = wrapIcon(HeroIcons.BuildingOffice2Icon, 'Building2');
export const Calculator = wrapIcon(HeroIcons.CalculatorIcon, 'Calculator');
export const Calendar = wrapIcon(HeroIcons.CalendarDaysIcon, 'Calendar');
export const Check = wrapIcon(HeroIcons.CheckIcon, 'Check');
export const CheckCircle = wrapIcon(HeroIcons.CheckCircleIcon, 'CheckCircle');
export const CheckCircle2 = wrapIcon(HeroIcons.CheckCircleIcon, 'CheckCircle2');
export const CheckSquare = wrapIcon(HeroIcons.CheckCircleIcon, 'CheckSquare');
export const ChevronDown = wrapIcon(HeroIcons.ChevronDownIcon, 'ChevronDown');
export const ChevronLeft = wrapIcon(HeroIcons.ChevronLeftIcon, 'ChevronLeft');
export const ChevronRight = wrapIcon(HeroIcons.ChevronRightIcon, 'ChevronRight');
export const ChevronUp = wrapIcon(HeroIcons.ChevronUpIcon, 'ChevronUp');
export const ClipboardCheck = wrapIcon(HeroIcons.ClipboardDocumentCheckIcon, 'ClipboardCheck');
export const ClipboardList = wrapIcon(HeroIcons.ClipboardDocumentListIcon, 'ClipboardList');
export const Clock = wrapIcon(HeroIcons.ClockIcon, 'Clock');
export const Clock3 = wrapIcon(HeroIcons.ClockIcon, 'Clock3');
export const Code = wrapIcon(HeroIcons.CodeBracketIcon, 'Code');
export const Code2 = wrapIcon(HeroIcons.CodeBracketSquareIcon, 'Code2');
export const Coins = wrapIcon(HeroIcons.CircleStackIcon, 'Coins');
export const Compass = wrapIcon(HeroIcons.GlobeAltIcon, 'Compass');
export const Copy = wrapIcon(HeroIcons.DocumentDuplicateIcon, 'Copy');
export const Cpu = wrapIcon(HeroIcons.CpuChipIcon, 'Cpu');
export const CreditCard = wrapIcon(HeroIcons.CreditCardIcon, 'CreditCard');
export const Crown = wrapIcon(HeroIcons.SparklesIcon, 'Crown');
export const Database = wrapIcon(HeroIcons.CircleStackIcon, 'Database');
export const DollarSign = wrapIcon(HeroIcons.CurrencyDollarIcon, 'DollarSign');
export const Download = wrapIcon(HeroIcons.ArrowDownTrayIcon, 'Download');
export const Edit = wrapIcon(HeroIcons.PencilSquareIcon, 'Edit');
export const Edit3 = wrapIcon(HeroIcons.PencilIcon, 'Edit3');
export const ExternalLink = wrapIcon(HeroIcons.ArrowTopRightOnSquareIcon, 'ExternalLink');
export const Eye = wrapIcon(HeroIcons.EyeIcon, 'Eye');
export const EyeOff = wrapIcon(HeroIcons.EyeSlashIcon, 'EyeOff');
export const Factory = wrapIcon(HeroIcons.BuildingOffice2Icon, 'Factory');
export const Feather = wrapIcon(HeroIcons.PencilIcon, 'Feather');
export const FileCode2 = wrapIcon(HeroIcons.CodeBracketIcon, 'FileCode2');
export const FileSpreadsheet = wrapIcon(HeroIcons.TableCellsIcon, 'FileSpreadsheet');
export const FileText = wrapIcon(HeroIcons.DocumentTextIcon, 'FileText');
export const Filter = wrapIcon(HeroIcons.FunnelIcon, 'Filter');
export const Gem = wrapIcon(HeroIcons.SparklesIcon, 'Gem');
export const Gift = wrapIcon(HeroIcons.GiftIcon, 'Gift');
export const Globe = wrapIcon(HeroIcons.GlobeAltIcon, 'Globe');
export const Grid = wrapIcon(HeroIcons.Squares2X2Icon, 'Grid');
export const Hash = wrapIcon(HeroIcons.HashtagIcon, 'Hash');
export const Headphones = wrapIcon(HeroIcons.SpeakerWaveIcon, 'Headphones');
export const Heart = wrapIcon(HeroIcons.HeartIcon, 'Heart');
export const HeartHandshake = wrapIcon(HeroIcons.HeartIcon, 'HeartHandshake');
export const HelpCircle = wrapIcon(HeroIcons.QuestionMarkCircleIcon, 'HelpCircle');
export const History = wrapIcon(HeroIcons.ClockIcon, 'History');
export const Home = wrapIcon(HeroIcons.HomeIcon, 'Home');
export const Image = wrapIcon(HeroIcons.PhotoIcon, 'Image');
export const Inbox = wrapIcon(HeroIcons.InboxIcon, 'Inbox');
export const IndianRupee = wrapIcon(HeroIcons.CurrencyRupeeIcon, 'IndianRupee');
export const Info = wrapIcon(HeroIcons.InformationCircleIcon, 'Info');
export const KeyRound = wrapIcon(HeroIcons.KeyIcon, 'KeyRound');
export const Landmark = wrapIcon(HeroIcons.BuildingLibraryIcon, 'Landmark');
export const Laptop = wrapIcon(HeroIcons.ComputerDesktopIcon, 'Laptop');
export const Layers = wrapIcon(HeroIcons.Square3Stack3DIcon, 'Layers');
export const LayoutDashboard = wrapIcon(HeroIcons.Squares2X2Icon, 'LayoutDashboard');
export const LayoutGrid = wrapIcon(HeroIcons.Squares2X2Icon, 'LayoutGrid');
export const LineChart = wrapIcon(HeroIcons.ChartBarIcon, 'LineChart');
export const Link = wrapIcon(HeroIcons.LinkIcon, 'Link');
export const Link2 = wrapIcon(HeroIcons.LinkIcon, 'Link2');
export const List = wrapIcon(HeroIcons.ListBulletIcon, 'List');
export const Loader = wrapIcon(HeroIcons.ArrowPathIcon, 'Loader');
export const Loader2 = wrapIcon(HeroIcons.ArrowPathIcon, 'Loader2');
export const Lock = wrapIcon(HeroIcons.LockClosedIcon, 'Lock');
export const LockKeyhole = wrapIcon(HeroIcons.LockClosedIcon, 'LockKeyhole');
export const LogOut = wrapIcon(HeroIcons.ArrowRightOnRectangleIcon, 'LogOut');
export const Mail = wrapIcon(HeroIcons.EnvelopeIcon, 'Mail');
export const MapPin = wrapIcon(HeroIcons.MapPinIcon, 'MapPin');
export const Maximize2 = wrapIcon(HeroIcons.ArrowsPointingOutIcon, 'Maximize2');
export const Menu = wrapIcon(HeroIcons.Bars3Icon, 'Menu');
export const MessageCircle = wrapIcon(HeroIcons.ChatBubbleOvalLeftEllipsisIcon, 'MessageCircle');
export const MessageSquare = wrapIcon(HeroIcons.ChatBubbleLeftRightIcon, 'MessageSquare');
export const MessageSquareText = wrapIcon(HeroIcons.ChatBubbleBottomCenterTextIcon, 'MessageSquareText');
export const Minus = wrapIcon(HeroIcons.MinusIcon, 'Minus');
export const MousePointer = wrapIcon(HeroIcons.CursorArrowRaysIcon, 'MousePointer');
export const MousePointerClick = wrapIcon(HeroIcons.CursorArrowRaysIcon, 'MousePointerClick');
export const MoveDown = wrapIcon(HeroIcons.ArrowDownIcon, 'MoveDown');
export const MoveUp = wrapIcon(HeroIcons.ArrowUpIcon, 'MoveUp');
export const Package = wrapIcon(HeroIcons.CubeIcon, 'Package');
export const PackageCheck = wrapIcon(HeroIcons.CubeIcon, 'PackageCheck');
export const PackagePlus = wrapIcon(HeroIcons.CubeIcon, 'PackagePlus');
export const Palette = wrapIcon(HeroIcons.SwatchIcon, 'Palette');
export const PenTool = wrapIcon(HeroIcons.PencilIcon, 'PenTool');
export const Percent = wrapIcon(HeroIcons.PercentBadgeIcon, 'Percent');
export const Phone = wrapIcon(HeroIcons.PhoneIcon, 'Phone');
export const Play = wrapIcon(HeroIcons.PlayIcon, 'Play');
export const Plus = wrapIcon(HeroIcons.PlusIcon, 'Plus');
export const Power = wrapIcon(HeroIcons.PowerIcon, 'Power');
export const Printer = wrapIcon(HeroIcons.PrinterIcon, 'Printer');
export const QrCode = wrapIcon(HeroIcons.QrCodeIcon, 'QrCode');
export const RefreshCw = wrapIcon(HeroIcons.ArrowPathIcon, 'RefreshCw');
export const RotateCcw = wrapIcon(HeroIcons.ArrowPathIcon, 'RotateCcw');
export const RotateCw = wrapIcon(HeroIcons.ArrowPathIcon, 'RotateCw');
export const Save = wrapIcon(HeroIcons.BookmarkIcon, 'Save');
export const Scale = wrapIcon(HeroIcons.ScaleIcon, 'Scale');
export const ScanSearch = wrapIcon(HeroIcons.QrCodeIcon, 'ScanSearch');
export const Search = wrapIcon(HeroIcons.MagnifyingGlassIcon, 'Search');
export const Send = wrapIcon(HeroIcons.PaperAirplaneIcon, 'Send');
export const Server = wrapIcon(HeroIcons.ServerIcon, 'Server');
export const Share2 = wrapIcon(HeroIcons.ShareIcon, 'Share2');
export const Shield = wrapIcon(HeroIcons.ShieldCheckIcon, 'Shield');
export const ShieldAlert = wrapIcon(HeroIcons.ShieldExclamationIcon, 'ShieldAlert');
export const ShieldCheck = wrapIcon(HeroIcons.ShieldCheckIcon, 'ShieldCheck');
export const ShoppingBag = wrapIcon(HeroIcons.ShoppingBagIcon, 'ShoppingBag');
export const Sliders = wrapIcon(HeroIcons.AdjustmentsHorizontalIcon, 'Sliders');
export const SlidersHorizontal = wrapIcon(HeroIcons.AdjustmentsHorizontalIcon, 'SlidersHorizontal');
export const Smartphone = wrapIcon(HeroIcons.DevicePhoneMobileIcon, 'Smartphone');
export const Sparkles = wrapIcon(HeroIcons.SparklesIcon, 'Sparkles');
export const Square = wrapIcon(HeroIcons.StopIcon, 'Square');
export const Star = wrapIcon(HeroIcons.StarIcon, 'Star');
export const Store = wrapIcon(HeroIcons.BuildingStorefrontIcon, 'Store');
export const Sun = wrapIcon(HeroIcons.SunIcon, 'Sun');
export const Tag = wrapIcon(HeroIcons.TagIcon, 'Tag');
export const Tags = wrapIcon(HeroIcons.TagIcon, 'Tags');
export const Terminal = wrapIcon(HeroIcons.CommandLineIcon, 'Terminal');
export const ThumbsUp = wrapIcon(HeroIcons.HandThumbUpIcon, 'ThumbsUp');
export const Trash2 = wrapIcon(HeroIcons.TrashIcon, 'Trash2');
export const TrendingUp = wrapIcon(HeroIcons.ArrowTrendingUpIcon, 'TrendingUp');
export const Truck = wrapIcon(HeroIcons.TruckIcon, 'Truck');
export const Type = wrapIcon(HeroIcons.LanguageIcon, 'Type');
export const Upload = wrapIcon(HeroIcons.ArrowUpTrayIcon, 'Upload');
export const User = wrapIcon(HeroIcons.UserIcon, 'User');
export const UserCheck = wrapIcon(HeroIcons.UserPlusIcon, 'UserCheck');
export const UserPlus = wrapIcon(HeroIcons.UserPlusIcon, 'UserPlus');
export const UserRound = wrapIcon(HeroIcons.UserIcon, 'UserRound');
export const Users = wrapIcon(HeroIcons.UsersIcon, 'Users');
export const X = wrapIcon(HeroIcons.XMarkIcon, 'X');
export const Zap = wrapIcon(HeroIcons.BoltIcon, 'Zap');
export const ZoomIn = wrapIcon(HeroIcons.MagnifyingGlassPlusIcon, 'ZoomIn');

// Also export raw Heroicons components wrapped for direct usage
export const AdjustmentsHorizontalIcon = wrapIcon(HeroIcons.AdjustmentsHorizontalIcon, 'AdjustmentsHorizontalIcon');
export const ArchiveBoxIcon = wrapIcon(HeroIcons.ArchiveBoxIcon, 'ArchiveBoxIcon');
export const ArrowDownIcon = wrapIcon(HeroIcons.ArrowDownIcon, 'ArrowDownIcon');
export const ArrowDownTrayIcon = wrapIcon(HeroIcons.ArrowDownTrayIcon, 'ArrowDownTrayIcon');
export const ArrowLeftIcon = wrapIcon(HeroIcons.ArrowLeftIcon, 'ArrowLeftIcon');
export const ArrowPathIcon = wrapIcon(HeroIcons.ArrowPathIcon, 'ArrowPathIcon');
export const ArrowRightIcon = wrapIcon(HeroIcons.ArrowRightIcon, 'ArrowRightIcon');
export const ArrowRightOnRectangleIcon = wrapIcon(HeroIcons.ArrowRightOnRectangleIcon, 'ArrowRightOnRectangleIcon');
export const ArrowTopRightOnSquareIcon = wrapIcon(HeroIcons.ArrowTopRightOnSquareIcon, 'ArrowTopRightOnSquareIcon');
export const ArrowTrendingUpIcon = wrapIcon(HeroIcons.ArrowTrendingUpIcon, 'ArrowTrendingUpIcon');
export const ArrowUpIcon = wrapIcon(HeroIcons.ArrowUpIcon, 'ArrowUpIcon');
export const ArrowUpRightIcon = wrapIcon(HeroIcons.ArrowUpRightIcon, 'ArrowUpRightIcon');
export const ArrowUpTrayIcon = wrapIcon(HeroIcons.ArrowUpTrayIcon, 'ArrowUpTrayIcon');
export const ArrowsPointingOutIcon = wrapIcon(HeroIcons.ArrowsPointingOutIcon, 'ArrowsPointingOutIcon');
export const ArrowsUpDownIcon = wrapIcon(HeroIcons.ArrowsUpDownIcon, 'ArrowsUpDownIcon');
export const Bars3BottomLeftIcon = wrapIcon(HeroIcons.Bars3BottomLeftIcon, 'Bars3BottomLeftIcon');
export const Bars3BottomRightIcon = wrapIcon(HeroIcons.Bars3BottomRightIcon, 'Bars3BottomRightIcon');
export const Bars3Icon = wrapIcon(HeroIcons.Bars3Icon, 'Bars3Icon');
export const BellIcon = wrapIcon(HeroIcons.BellIcon, 'BellIcon');
export const BoltIcon = wrapIcon(HeroIcons.BoltIcon, 'BoltIcon');
export const BookOpenIcon = wrapIcon(HeroIcons.BookOpenIcon, 'BookOpenIcon');
export const BookmarkIcon = wrapIcon(HeroIcons.BookmarkIcon, 'BookmarkIcon');
export const BriefcaseIcon = wrapIcon(HeroIcons.BriefcaseIcon, 'BriefcaseIcon');
export const BuildingLibraryIcon = wrapIcon(HeroIcons.BuildingLibraryIcon, 'BuildingLibraryIcon');
export const BuildingOffice2Icon = wrapIcon(HeroIcons.BuildingOffice2Icon, 'BuildingOffice2Icon');
export const BuildingOfficeIcon = wrapIcon(HeroIcons.BuildingOfficeIcon, 'BuildingOfficeIcon');
export const BuildingStorefrontIcon = wrapIcon(HeroIcons.BuildingStorefrontIcon, 'BuildingStorefrontIcon');
export const CalculatorIcon = wrapIcon(HeroIcons.CalculatorIcon, 'CalculatorIcon');
export const CalendarDaysIcon = wrapIcon(HeroIcons.CalendarDaysIcon, 'CalendarDaysIcon');
export const ChartBarIcon = wrapIcon(HeroIcons.ChartBarIcon, 'ChartBarIcon');
export const ChartBarSquareIcon = wrapIcon(HeroIcons.ChartBarSquareIcon, 'ChartBarSquareIcon');
export const ChatBubbleBottomCenterTextIcon = wrapIcon(HeroIcons.ChatBubbleBottomCenterTextIcon, 'ChatBubbleBottomCenterTextIcon');
export const ChatBubbleLeftRightIcon = wrapIcon(HeroIcons.ChatBubbleLeftRightIcon, 'ChatBubbleLeftRightIcon');
export const ChatBubbleOvalLeftEllipsisIcon = wrapIcon(HeroIcons.ChatBubbleOvalLeftEllipsisIcon, 'ChatBubbleOvalLeftEllipsisIcon');
export const CheckBadgeIcon = wrapIcon(HeroIcons.CheckBadgeIcon, 'CheckBadgeIcon');
export const CheckCircleIcon = wrapIcon(HeroIcons.CheckCircleIcon, 'CheckCircleIcon');
export const CheckIcon = wrapIcon(HeroIcons.CheckIcon, 'CheckIcon');
export const ChevronDownIcon = wrapIcon(HeroIcons.ChevronDownIcon, 'ChevronDownIcon');
export const ChevronLeftIcon = wrapIcon(HeroIcons.ChevronLeftIcon, 'ChevronLeftIcon');
export const ChevronRightIcon = wrapIcon(HeroIcons.ChevronRightIcon, 'ChevronRightIcon');
export const ChevronUpIcon = wrapIcon(HeroIcons.ChevronUpIcon, 'ChevronUpIcon');
export const CircleStackIcon = wrapIcon(HeroIcons.CircleStackIcon, 'CircleStackIcon');
export const ClipboardDocumentCheckIcon = wrapIcon(HeroIcons.ClipboardDocumentCheckIcon, 'ClipboardDocumentCheckIcon');
export const ClipboardDocumentListIcon = wrapIcon(HeroIcons.ClipboardDocumentListIcon, 'ClipboardDocumentListIcon');
export const ClockIcon = wrapIcon(HeroIcons.ClockIcon, 'ClockIcon');
export const CodeBracketIcon = wrapIcon(HeroIcons.CodeBracketIcon, 'CodeBracketIcon');
export const CodeBracketSquareIcon = wrapIcon(HeroIcons.CodeBracketSquareIcon, 'CodeBracketSquareIcon');
export const CommandLineIcon = wrapIcon(HeroIcons.CommandLineIcon, 'CommandLineIcon');
export const ComputerDesktopIcon = wrapIcon(HeroIcons.ComputerDesktopIcon, 'ComputerDesktopIcon');
export const CpuChipIcon = wrapIcon(HeroIcons.CpuChipIcon, 'CpuChipIcon');
export const CreditCardIcon = wrapIcon(HeroIcons.CreditCardIcon, 'CreditCardIcon');
export const CubeIcon = wrapIcon(HeroIcons.CubeIcon, 'CubeIcon');
export const CurrencyDollarIcon = wrapIcon(HeroIcons.CurrencyDollarIcon, 'CurrencyDollarIcon');
export const CurrencyRupeeIcon = wrapIcon(HeroIcons.CurrencyRupeeIcon, 'CurrencyRupeeIcon');
export const CursorArrowRaysIcon = wrapIcon(HeroIcons.CursorArrowRaysIcon, 'CursorArrowRaysIcon');
export const DevicePhoneMobileIcon = wrapIcon(HeroIcons.DevicePhoneMobileIcon, 'DevicePhoneMobileIcon');
export const DocumentDuplicateIcon = wrapIcon(HeroIcons.DocumentDuplicateIcon, 'DocumentDuplicateIcon');
export const DocumentTextIcon = wrapIcon(HeroIcons.DocumentTextIcon, 'DocumentTextIcon');
export const EnvelopeIcon = wrapIcon(HeroIcons.EnvelopeIcon, 'EnvelopeIcon');
export const ExclamationCircleIcon = wrapIcon(HeroIcons.ExclamationCircleIcon, 'ExclamationCircleIcon');
export const ExclamationTriangleIcon = wrapIcon(HeroIcons.ExclamationTriangleIcon, 'ExclamationTriangleIcon');
export const EyeIcon = wrapIcon(HeroIcons.EyeIcon, 'EyeIcon');
export const EyeSlashIcon = wrapIcon(HeroIcons.EyeSlashIcon, 'EyeSlashIcon');
export const FunnelIcon = wrapIcon(HeroIcons.FunnelIcon, 'FunnelIcon');
export const GiftIcon = wrapIcon(HeroIcons.GiftIcon, 'GiftIcon');
export const GlobeAltIcon = wrapIcon(HeroIcons.GlobeAltIcon, 'GlobeAltIcon');
export const HandThumbUpIcon = wrapIcon(HeroIcons.HandThumbUpIcon, 'HandThumbUpIcon');
export const HashtagIcon = wrapIcon(HeroIcons.HashtagIcon, 'HashtagIcon');
export const HeartIcon = wrapIcon(HeroIcons.HeartIcon, 'HeartIcon');
export const HomeIcon = wrapIcon(HeroIcons.HomeIcon, 'HomeIcon');
export const InboxIcon = wrapIcon(HeroIcons.InboxIcon, 'InboxIcon');
export const InformationCircleIcon = wrapIcon(HeroIcons.InformationCircleIcon, 'InformationCircleIcon');
export const KeyIcon = wrapIcon(HeroIcons.KeyIcon, 'KeyIcon');
export const LanguageIcon = wrapIcon(HeroIcons.LanguageIcon, 'LanguageIcon');
export const LinkIcon = wrapIcon(HeroIcons.LinkIcon, 'LinkIcon');
export const ListBulletIcon = wrapIcon(HeroIcons.ListBulletIcon, 'ListBulletIcon');
export const LockClosedIcon = wrapIcon(HeroIcons.LockClosedIcon, 'LockClosedIcon');
export const MagnifyingGlassIcon = wrapIcon(HeroIcons.MagnifyingGlassIcon, 'MagnifyingGlassIcon');
export const MagnifyingGlassPlusIcon = wrapIcon(HeroIcons.MagnifyingGlassPlusIcon, 'MagnifyingGlassPlusIcon');
export const MapPinIcon = wrapIcon(HeroIcons.MapPinIcon, 'MapPinIcon');
export const MinusIcon = wrapIcon(HeroIcons.MinusIcon, 'MinusIcon');
export const PaperAirplaneIcon = wrapIcon(HeroIcons.PaperAirplaneIcon, 'PaperAirplaneIcon');
export const PencilIcon = wrapIcon(HeroIcons.PencilIcon, 'PencilIcon');
export const PencilSquareIcon = wrapIcon(HeroIcons.PencilSquareIcon, 'PencilSquareIcon');
export const PercentBadgeIcon = wrapIcon(HeroIcons.PercentBadgeIcon, 'PercentBadgeIcon');
export const PhoneIcon = wrapIcon(HeroIcons.PhoneIcon, 'PhoneIcon');
export const PhotoIcon = wrapIcon(HeroIcons.PhotoIcon, 'PhotoIcon');
export const PlayIcon = wrapIcon(HeroIcons.PlayIcon, 'PlayIcon');
export const PlusIcon = wrapIcon(HeroIcons.PlusIcon, 'PlusIcon');
export const PowerIcon = wrapIcon(HeroIcons.PowerIcon, 'PowerIcon');
export const PrinterIcon = wrapIcon(HeroIcons.PrinterIcon, 'PrinterIcon');
export const QrCodeIcon = wrapIcon(HeroIcons.QrCodeIcon, 'QrCodeIcon');
export const QuestionMarkCircleIcon = wrapIcon(HeroIcons.QuestionMarkCircleIcon, 'QuestionMarkCircleIcon');
export const ScaleIcon = wrapIcon(HeroIcons.ScaleIcon, 'ScaleIcon');
export const ServerIcon = wrapIcon(HeroIcons.ServerIcon, 'ServerIcon');
export const ShareIcon = wrapIcon(HeroIcons.ShareIcon, 'ShareIcon');
export const ShieldCheckIcon = wrapIcon(HeroIcons.ShieldCheckIcon, 'ShieldCheckIcon');
export const ShieldExclamationIcon = wrapIcon(HeroIcons.ShieldExclamationIcon, 'ShieldExclamationIcon');
export const ShoppingBagIcon = wrapIcon(HeroIcons.ShoppingBagIcon, 'ShoppingBagIcon');
export const SparklesIcon = wrapIcon(HeroIcons.SparklesIcon, 'SparklesIcon');
export const SpeakerWaveIcon = wrapIcon(HeroIcons.SpeakerWaveIcon, 'SpeakerWaveIcon');
export const Square3Stack3DIcon = wrapIcon(HeroIcons.Square3Stack3DIcon, 'Square3Stack3DIcon');
export const Squares2X2Icon = wrapIcon(HeroIcons.Squares2X2Icon, 'Squares2X2Icon');
export const StarIcon = wrapIcon(HeroIcons.StarIcon, 'StarIcon');
export const StopIcon = wrapIcon(HeroIcons.StopIcon, 'StopIcon');
export const SunIcon = wrapIcon(HeroIcons.SunIcon, 'SunIcon');
export const SwatchIcon = wrapIcon(HeroIcons.SwatchIcon, 'SwatchIcon');
export const TableCellsIcon = wrapIcon(HeroIcons.TableCellsIcon, 'TableCellsIcon');
export const TagIcon = wrapIcon(HeroIcons.TagIcon, 'TagIcon');
export const TrashIcon = wrapIcon(HeroIcons.TrashIcon, 'TrashIcon');
export const TrophyIcon = wrapIcon(HeroIcons.TrophyIcon, 'TrophyIcon');
export const TruckIcon = wrapIcon(HeroIcons.TruckIcon, 'TruckIcon');
export const UserIcon = wrapIcon(HeroIcons.UserIcon, 'UserIcon');
export const UserPlusIcon = wrapIcon(HeroIcons.UserPlusIcon, 'UserPlusIcon');
export const UsersIcon = wrapIcon(HeroIcons.UsersIcon, 'UsersIcon');
export const XMarkIcon = wrapIcon(HeroIcons.XMarkIcon, 'XMarkIcon');
