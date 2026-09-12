/**
 * Centralized SVG Icon Adapter for Weave365 B2B
 * Powered by @heroicons/react (24/outline) with pixel-exact prop compatibility
 * Supports size={...}, strokeWidth={...}, className, and inline styles seamlessly.
 */
import React from 'react';
import {
  AdjustmentsHorizontalIcon as Hero_AdjustmentsHorizontalIcon,
  ArchiveBoxIcon as Hero_ArchiveBoxIcon,
  ArrowDownIcon as Hero_ArrowDownIcon,
  ArrowDownTrayIcon as Hero_ArrowDownTrayIcon,
  ArrowLeftIcon as Hero_ArrowLeftIcon,
  ArrowPathIcon as Hero_ArrowPathIcon,
  ArrowRightIcon as Hero_ArrowRightIcon,
  ArrowRightOnRectangleIcon as Hero_ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon as Hero_ArrowTopRightOnSquareIcon,
  ArrowTrendingUpIcon as Hero_ArrowTrendingUpIcon,
  ArrowUpIcon as Hero_ArrowUpIcon,
  ArrowUpRightIcon as Hero_ArrowUpRightIcon,
  ArrowUpTrayIcon as Hero_ArrowUpTrayIcon,
  ArrowsPointingOutIcon as Hero_ArrowsPointingOutIcon,
  ArrowsUpDownIcon as Hero_ArrowsUpDownIcon,
  Bars3BottomLeftIcon as Hero_Bars3BottomLeftIcon,
  Bars3BottomRightIcon as Hero_Bars3BottomRightIcon,
  Bars3Icon as Hero_Bars3Icon,
  BellIcon as Hero_BellIcon,
  BoltIcon as Hero_BoltIcon,
  BookOpenIcon as Hero_BookOpenIcon,
  BookmarkIcon as Hero_BookmarkIcon,
  BriefcaseIcon as Hero_BriefcaseIcon,
  BuildingLibraryIcon as Hero_BuildingLibraryIcon,
  BuildingOffice2Icon as Hero_BuildingOffice2Icon,
  BuildingOfficeIcon as Hero_BuildingOfficeIcon,
  BuildingStorefrontIcon as Hero_BuildingStorefrontIcon,
  CalculatorIcon as Hero_CalculatorIcon,
  CalendarDaysIcon as Hero_CalendarDaysIcon,
  ChartBarIcon as Hero_ChartBarIcon,
  ChartBarSquareIcon as Hero_ChartBarSquareIcon,
  ChatBubbleBottomCenterTextIcon as Hero_ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon as Hero_ChatBubbleLeftRightIcon,
  ChatBubbleOvalLeftEllipsisIcon as Hero_ChatBubbleOvalLeftEllipsisIcon,
  CheckBadgeIcon as Hero_CheckBadgeIcon,
  CheckCircleIcon as Hero_CheckCircleIcon,
  CheckIcon as Hero_CheckIcon,
  ChevronDownIcon as Hero_ChevronDownIcon,
  ChevronLeftIcon as Hero_ChevronLeftIcon,
  ChevronRightIcon as Hero_ChevronRightIcon,
  ChevronUpIcon as Hero_ChevronUpIcon,
  CircleStackIcon as Hero_CircleStackIcon,
  ClipboardDocumentCheckIcon as Hero_ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon as Hero_ClipboardDocumentListIcon,
  ClockIcon as Hero_ClockIcon,
  CodeBracketIcon as Hero_CodeBracketIcon,
  CodeBracketSquareIcon as Hero_CodeBracketSquareIcon,
  CommandLineIcon as Hero_CommandLineIcon,
  ComputerDesktopIcon as Hero_ComputerDesktopIcon,
  CpuChipIcon as Hero_CpuChipIcon,
  CreditCardIcon as Hero_CreditCardIcon,
  CubeIcon as Hero_CubeIcon,
  CurrencyDollarIcon as Hero_CurrencyDollarIcon,
  CurrencyRupeeIcon as Hero_CurrencyRupeeIcon,
  CursorArrowRaysIcon as Hero_CursorArrowRaysIcon,
  DevicePhoneMobileIcon as Hero_DevicePhoneMobileIcon,
  DocumentDuplicateIcon as Hero_DocumentDuplicateIcon,
  DocumentTextIcon as Hero_DocumentTextIcon,
  EnvelopeIcon as Hero_EnvelopeIcon,
  ExclamationCircleIcon as Hero_ExclamationCircleIcon,
  ExclamationTriangleIcon as Hero_ExclamationTriangleIcon,
  EyeIcon as Hero_EyeIcon,
  EyeSlashIcon as Hero_EyeSlashIcon,
  FunnelIcon as Hero_FunnelIcon,
  GiftIcon as Hero_GiftIcon,
  GlobeAltIcon as Hero_GlobeAltIcon,
  HandThumbUpIcon as Hero_HandThumbUpIcon,
  HashtagIcon as Hero_HashtagIcon,
  HeartIcon as Hero_HeartIcon,
  HomeIcon as Hero_HomeIcon,
  InboxIcon as Hero_InboxIcon,
  InformationCircleIcon as Hero_InformationCircleIcon,
  KeyIcon as Hero_KeyIcon,
  LanguageIcon as Hero_LanguageIcon,
  LinkIcon as Hero_LinkIcon,
  ListBulletIcon as Hero_ListBulletIcon,
  LockClosedIcon as Hero_LockClosedIcon,
  MagnifyingGlassIcon as Hero_MagnifyingGlassIcon,
  MagnifyingGlassPlusIcon as Hero_MagnifyingGlassPlusIcon,
  MapPinIcon as Hero_MapPinIcon,
  MinusIcon as Hero_MinusIcon,
  PaperAirplaneIcon as Hero_PaperAirplaneIcon,
  PencilIcon as Hero_PencilIcon,
  PencilSquareIcon as Hero_PencilSquareIcon,
  PercentBadgeIcon as Hero_PercentBadgeIcon,
  PhoneIcon as Hero_PhoneIcon,
  PhotoIcon as Hero_PhotoIcon,
  PlayIcon as Hero_PlayIcon,
  PlusIcon as Hero_PlusIcon,
  PowerIcon as Hero_PowerIcon,
  PrinterIcon as Hero_PrinterIcon,
  QrCodeIcon as Hero_QrCodeIcon,
  QuestionMarkCircleIcon as Hero_QuestionMarkCircleIcon,
  ScaleIcon as Hero_ScaleIcon,
  ServerIcon as Hero_ServerIcon,
  ShareIcon as Hero_ShareIcon,
  ShieldCheckIcon as Hero_ShieldCheckIcon,
  ShieldExclamationIcon as Hero_ShieldExclamationIcon,
  ShoppingBagIcon as Hero_ShoppingBagIcon,
  SparklesIcon as Hero_SparklesIcon,
  SpeakerWaveIcon as Hero_SpeakerWaveIcon,
  Square3Stack3DIcon as Hero_Square3Stack3DIcon,
  Squares2X2Icon as Hero_Squares2X2Icon,
  StarIcon as Hero_StarIcon,
  StopIcon as Hero_StopIcon,
  SunIcon as Hero_SunIcon,
  SwatchIcon as Hero_SwatchIcon,
  TableCellsIcon as Hero_TableCellsIcon,
  TagIcon as Hero_TagIcon,
  TrashIcon as Hero_TrashIcon,
  TrophyIcon as Hero_TrophyIcon,
  TruckIcon as Hero_TruckIcon,
  UserIcon as Hero_UserIcon,
  UserPlusIcon as Hero_UserPlusIcon,
  UsersIcon as Hero_UsersIcon,
  XMarkIcon as Hero_XMarkIcon
} from '@heroicons/react/24/outline';

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
export const Activity = wrapIcon(Hero_ChartBarSquareIcon, 'Activity');
export const AlertCircle = wrapIcon(Hero_ExclamationCircleIcon, 'AlertCircle');
export const AlertTriangle = wrapIcon(Hero_ExclamationTriangleIcon, 'AlertTriangle');
export const AlignCenter = wrapIcon(Hero_Bars3Icon, 'AlignCenter');
export const AlignLeft = wrapIcon(Hero_Bars3BottomLeftIcon, 'AlignLeft');
export const AlignRight = wrapIcon(Hero_Bars3BottomRightIcon, 'AlignRight');
export const ArrowDown = wrapIcon(Hero_ArrowDownIcon, 'ArrowDown');
export const ArrowLeft = wrapIcon(Hero_ArrowLeftIcon, 'ArrowLeft');
export const ArrowRight = wrapIcon(Hero_ArrowRightIcon, 'ArrowRight');
export const ArrowUpDown = wrapIcon(Hero_ArrowsUpDownIcon, 'ArrowUpDown');
export const ArrowUpRight = wrapIcon(Hero_ArrowUpRightIcon, 'ArrowUpRight');
export const Award = wrapIcon(Hero_TrophyIcon, 'Award');
export const BadgeCheck = wrapIcon(Hero_CheckBadgeIcon, 'BadgeCheck');
export const BadgePercent = wrapIcon(Hero_TagIcon, 'BadgePercent');
export const Bell = wrapIcon(Hero_BellIcon, 'Bell');
export const BookOpen = wrapIcon(Hero_BookOpenIcon, 'BookOpen');
export const Bookmark = wrapIcon(Hero_BookmarkIcon, 'Bookmark');
export const Bot = wrapIcon(Hero_CpuChipIcon, 'Bot');
export const Box = wrapIcon(Hero_ArchiveBoxIcon, 'Box');
export const Boxes = wrapIcon(Hero_Square3Stack3DIcon, 'Boxes');
export const Briefcase = wrapIcon(Hero_BriefcaseIcon, 'Briefcase');
export const Building = wrapIcon(Hero_BuildingOfficeIcon, 'Building');
export const Building2 = wrapIcon(Hero_BuildingOffice2Icon, 'Building2');
export const Calculator = wrapIcon(Hero_CalculatorIcon, 'Calculator');
export const Calendar = wrapIcon(Hero_CalendarDaysIcon, 'Calendar');
export const Check = wrapIcon(Hero_CheckIcon, 'Check');
export const CheckCircle = wrapIcon(Hero_CheckCircleIcon, 'CheckCircle');
export const CheckCircle2 = wrapIcon(Hero_CheckCircleIcon, 'CheckCircle2');
export const CheckSquare = wrapIcon(Hero_CheckCircleIcon, 'CheckSquare');
export const ChevronDown = wrapIcon(Hero_ChevronDownIcon, 'ChevronDown');
export const ChevronLeft = wrapIcon(Hero_ChevronLeftIcon, 'ChevronLeft');
export const ChevronRight = wrapIcon(Hero_ChevronRightIcon, 'ChevronRight');
export const ChevronUp = wrapIcon(Hero_ChevronUpIcon, 'ChevronUp');
export const ClipboardCheck = wrapIcon(Hero_ClipboardDocumentCheckIcon, 'ClipboardCheck');
export const ClipboardList = wrapIcon(Hero_ClipboardDocumentListIcon, 'ClipboardList');
export const Clock = wrapIcon(Hero_ClockIcon, 'Clock');
export const Clock3 = wrapIcon(Hero_ClockIcon, 'Clock3');
export const Code = wrapIcon(Hero_CodeBracketIcon, 'Code');
export const Code2 = wrapIcon(Hero_CodeBracketSquareIcon, 'Code2');
export const Coins = wrapIcon(Hero_CircleStackIcon, 'Coins');
export const Compass = wrapIcon(Hero_GlobeAltIcon, 'Compass');
export const Copy = wrapIcon(Hero_DocumentDuplicateIcon, 'Copy');
export const Cpu = wrapIcon(Hero_CpuChipIcon, 'Cpu');
export const CreditCard = wrapIcon(Hero_CreditCardIcon, 'CreditCard');
export const Crown = wrapIcon(Hero_SparklesIcon, 'Crown');
export const Database = wrapIcon(Hero_CircleStackIcon, 'Database');
export const DollarSign = wrapIcon(Hero_CurrencyDollarIcon, 'DollarSign');
export const Download = wrapIcon(Hero_ArrowDownTrayIcon, 'Download');
export const Edit = wrapIcon(Hero_PencilSquareIcon, 'Edit');
export const Edit3 = wrapIcon(Hero_PencilIcon, 'Edit3');
export const ExternalLink = wrapIcon(Hero_ArrowTopRightOnSquareIcon, 'ExternalLink');
export const Eye = wrapIcon(Hero_EyeIcon, 'Eye');
export const EyeOff = wrapIcon(Hero_EyeSlashIcon, 'EyeOff');
export const Factory = wrapIcon(Hero_BuildingOffice2Icon, 'Factory');
export const Feather = wrapIcon(Hero_PencilIcon, 'Feather');
export const FileCode2 = wrapIcon(Hero_CodeBracketIcon, 'FileCode2');
export const FileSpreadsheet = wrapIcon(Hero_TableCellsIcon, 'FileSpreadsheet');
export const FileText = wrapIcon(Hero_DocumentTextIcon, 'FileText');
export const Filter = wrapIcon(Hero_FunnelIcon, 'Filter');
export const Gem = wrapIcon(Hero_SparklesIcon, 'Gem');
export const Gift = wrapIcon(Hero_GiftIcon, 'Gift');
export const Globe = wrapIcon(Hero_GlobeAltIcon, 'Globe');
export const Grid = wrapIcon(Hero_Squares2X2Icon, 'Grid');
export const Hash = wrapIcon(Hero_HashtagIcon, 'Hash');
export const Headphones = wrapIcon(Hero_SpeakerWaveIcon, 'Headphones');
export const Heart = wrapIcon(Hero_HeartIcon, 'Heart');
export const HeartHandshake = wrapIcon(Hero_HeartIcon, 'HeartHandshake');
export const HelpCircle = wrapIcon(Hero_QuestionMarkCircleIcon, 'HelpCircle');
export const History = wrapIcon(Hero_ClockIcon, 'History');
export const Home = wrapIcon(Hero_HomeIcon, 'Home');
export const Image = wrapIcon(Hero_PhotoIcon, 'Image');
export const Inbox = wrapIcon(Hero_InboxIcon, 'Inbox');
export const IndianRupee = wrapIcon(Hero_CurrencyRupeeIcon, 'IndianRupee');
export const Info = wrapIcon(Hero_InformationCircleIcon, 'Info');
export const KeyRound = wrapIcon(Hero_KeyIcon, 'KeyRound');
export const Landmark = wrapIcon(Hero_BuildingLibraryIcon, 'Landmark');
export const Laptop = wrapIcon(Hero_ComputerDesktopIcon, 'Laptop');
export const Layers = wrapIcon(Hero_Square3Stack3DIcon, 'Layers');
export const LayoutDashboard = wrapIcon(Hero_Squares2X2Icon, 'LayoutDashboard');
export const LayoutGrid = wrapIcon(Hero_Squares2X2Icon, 'LayoutGrid');
export const LineChart = wrapIcon(Hero_ChartBarIcon, 'LineChart');
export const Link = wrapIcon(Hero_LinkIcon, 'Link');
export const Link2 = wrapIcon(Hero_LinkIcon, 'Link2');
export const List = wrapIcon(Hero_ListBulletIcon, 'List');
export const Loader = wrapIcon(Hero_ArrowPathIcon, 'Loader');
export const Loader2 = wrapIcon(Hero_ArrowPathIcon, 'Loader2');
export const Lock = wrapIcon(Hero_LockClosedIcon, 'Lock');
export const LockKeyhole = wrapIcon(Hero_LockClosedIcon, 'LockKeyhole');
export const LogOut = wrapIcon(Hero_ArrowRightOnRectangleIcon, 'LogOut');
export const Mail = wrapIcon(Hero_EnvelopeIcon, 'Mail');
export const MapPin = wrapIcon(Hero_MapPinIcon, 'MapPin');
export const Maximize2 = wrapIcon(Hero_ArrowsPointingOutIcon, 'Maximize2');
export const Menu = wrapIcon(Hero_Bars3Icon, 'Menu');
export const MessageCircle = wrapIcon(Hero_ChatBubbleOvalLeftEllipsisIcon, 'MessageCircle');
export const MessageSquare = wrapIcon(Hero_ChatBubbleLeftRightIcon, 'MessageSquare');
export const MessageSquareText = wrapIcon(Hero_ChatBubbleBottomCenterTextIcon, 'MessageSquareText');
export const Minus = wrapIcon(Hero_MinusIcon, 'Minus');
export const MousePointer = wrapIcon(Hero_CursorArrowRaysIcon, 'MousePointer');
export const MousePointerClick = wrapIcon(Hero_CursorArrowRaysIcon, 'MousePointerClick');
export const MoveDown = wrapIcon(Hero_ArrowDownIcon, 'MoveDown');
export const MoveUp = wrapIcon(Hero_ArrowUpIcon, 'MoveUp');
export const Package = wrapIcon(Hero_CubeIcon, 'Package');
export const PackageCheck = wrapIcon(Hero_CubeIcon, 'PackageCheck');
export const PackagePlus = wrapIcon(Hero_CubeIcon, 'PackagePlus');
export const Palette = wrapIcon(Hero_SwatchIcon, 'Palette');
export const PenTool = wrapIcon(Hero_PencilIcon, 'PenTool');
export const Percent = wrapIcon(Hero_PercentBadgeIcon, 'Percent');
export const Phone = wrapIcon(Hero_PhoneIcon, 'Phone');
export const Play = wrapIcon(Hero_PlayIcon, 'Play');
export const Plus = wrapIcon(Hero_PlusIcon, 'Plus');
export const Power = wrapIcon(Hero_PowerIcon, 'Power');
export const Printer = wrapIcon(Hero_PrinterIcon, 'Printer');
export const QrCode = wrapIcon(Hero_QrCodeIcon, 'QrCode');
export const RefreshCw = wrapIcon(Hero_ArrowPathIcon, 'RefreshCw');
export const RotateCcw = wrapIcon(Hero_ArrowPathIcon, 'RotateCcw');
export const RotateCw = wrapIcon(Hero_ArrowPathIcon, 'RotateCw');
export const Save = wrapIcon(Hero_BookmarkIcon, 'Save');
export const Scale = wrapIcon(Hero_ScaleIcon, 'Scale');
export const ScanSearch = wrapIcon(Hero_QrCodeIcon, 'ScanSearch');
export const Search = wrapIcon(Hero_MagnifyingGlassIcon, 'Search');
export const Send = wrapIcon(Hero_PaperAirplaneIcon, 'Send');
export const Server = wrapIcon(Hero_ServerIcon, 'Server');
export const Share2 = wrapIcon(Hero_ShareIcon, 'Share2');
export const Shield = wrapIcon(Hero_ShieldCheckIcon, 'Shield');
export const ShieldAlert = wrapIcon(Hero_ShieldExclamationIcon, 'ShieldAlert');
export const ShieldCheck = wrapIcon(Hero_ShieldCheckIcon, 'ShieldCheck');
export const ShoppingBag = wrapIcon(Hero_ShoppingBagIcon, 'ShoppingBag');
export const Sliders = wrapIcon(Hero_AdjustmentsHorizontalIcon, 'Sliders');
export const SlidersHorizontal = wrapIcon(Hero_AdjustmentsHorizontalIcon, 'SlidersHorizontal');
export const Smartphone = wrapIcon(Hero_DevicePhoneMobileIcon, 'Smartphone');
export const Sparkles = wrapIcon(Hero_SparklesIcon, 'Sparkles');
export const Square = wrapIcon(Hero_StopIcon, 'Square');
export const Star = wrapIcon(Hero_StarIcon, 'Star');
export const Store = wrapIcon(Hero_BuildingStorefrontIcon, 'Store');
export const Sun = wrapIcon(Hero_SunIcon, 'Sun');
export const Tag = wrapIcon(Hero_TagIcon, 'Tag');
export const Tags = wrapIcon(Hero_TagIcon, 'Tags');
export const Terminal = wrapIcon(Hero_CommandLineIcon, 'Terminal');
export const ThumbsUp = wrapIcon(Hero_HandThumbUpIcon, 'ThumbsUp');
export const Trash2 = wrapIcon(Hero_TrashIcon, 'Trash2');
export const TrendingUp = wrapIcon(Hero_ArrowTrendingUpIcon, 'TrendingUp');
export const Truck = wrapIcon(Hero_TruckIcon, 'Truck');
export const Type = wrapIcon(Hero_LanguageIcon, 'Type');
export const Upload = wrapIcon(Hero_ArrowUpTrayIcon, 'Upload');
export const User = wrapIcon(Hero_UserIcon, 'User');
export const UserCheck = wrapIcon(Hero_UserPlusIcon, 'UserCheck');
export const UserPlus = wrapIcon(Hero_UserPlusIcon, 'UserPlus');
export const UserRound = wrapIcon(Hero_UserIcon, 'UserRound');
export const Users = wrapIcon(Hero_UsersIcon, 'Users');
export const X = wrapIcon(Hero_XMarkIcon, 'X');
export const Zap = wrapIcon(Hero_BoltIcon, 'Zap');
export const ZoomIn = wrapIcon(Hero_MagnifyingGlassPlusIcon, 'ZoomIn');

// Also export raw Heroicons components wrapped for direct usage
export const AdjustmentsHorizontalIcon = wrapIcon(Hero_AdjustmentsHorizontalIcon, 'AdjustmentsHorizontalIcon');
export const ArchiveBoxIcon = wrapIcon(Hero_ArchiveBoxIcon, 'ArchiveBoxIcon');
export const ArrowDownIcon = wrapIcon(Hero_ArrowDownIcon, 'ArrowDownIcon');
export const ArrowDownTrayIcon = wrapIcon(Hero_ArrowDownTrayIcon, 'ArrowDownTrayIcon');
export const ArrowLeftIcon = wrapIcon(Hero_ArrowLeftIcon, 'ArrowLeftIcon');
export const ArrowPathIcon = wrapIcon(Hero_ArrowPathIcon, 'ArrowPathIcon');
export const ArrowRightIcon = wrapIcon(Hero_ArrowRightIcon, 'ArrowRightIcon');
export const ArrowRightOnRectangleIcon = wrapIcon(Hero_ArrowRightOnRectangleIcon, 'ArrowRightOnRectangleIcon');
export const ArrowTopRightOnSquareIcon = wrapIcon(Hero_ArrowTopRightOnSquareIcon, 'ArrowTopRightOnSquareIcon');
export const ArrowTrendingUpIcon = wrapIcon(Hero_ArrowTrendingUpIcon, 'ArrowTrendingUpIcon');
export const ArrowUpIcon = wrapIcon(Hero_ArrowUpIcon, 'ArrowUpIcon');
export const ArrowUpRightIcon = wrapIcon(Hero_ArrowUpRightIcon, 'ArrowUpRightIcon');
export const ArrowUpTrayIcon = wrapIcon(Hero_ArrowUpTrayIcon, 'ArrowUpTrayIcon');
export const ArrowsPointingOutIcon = wrapIcon(Hero_ArrowsPointingOutIcon, 'ArrowsPointingOutIcon');
export const ArrowsUpDownIcon = wrapIcon(Hero_ArrowsUpDownIcon, 'ArrowsUpDownIcon');
export const Bars3BottomLeftIcon = wrapIcon(Hero_Bars3BottomLeftIcon, 'Bars3BottomLeftIcon');
export const Bars3BottomRightIcon = wrapIcon(Hero_Bars3BottomRightIcon, 'Bars3BottomRightIcon');
export const Bars3Icon = wrapIcon(Hero_Bars3Icon, 'Bars3Icon');
export const BellIcon = wrapIcon(Hero_BellIcon, 'BellIcon');
export const BoltIcon = wrapIcon(Hero_BoltIcon, 'BoltIcon');
export const BookOpenIcon = wrapIcon(Hero_BookOpenIcon, 'BookOpenIcon');
export const BookmarkIcon = wrapIcon(Hero_BookmarkIcon, 'BookmarkIcon');
export const BriefcaseIcon = wrapIcon(Hero_BriefcaseIcon, 'BriefcaseIcon');
export const BuildingLibraryIcon = wrapIcon(Hero_BuildingLibraryIcon, 'BuildingLibraryIcon');
export const BuildingOffice2Icon = wrapIcon(Hero_BuildingOffice2Icon, 'BuildingOffice2Icon');
export const BuildingOfficeIcon = wrapIcon(Hero_BuildingOfficeIcon, 'BuildingOfficeIcon');
export const BuildingStorefrontIcon = wrapIcon(Hero_BuildingStorefrontIcon, 'BuildingStorefrontIcon');
export const CalculatorIcon = wrapIcon(Hero_CalculatorIcon, 'CalculatorIcon');
export const CalendarDaysIcon = wrapIcon(Hero_CalendarDaysIcon, 'CalendarDaysIcon');
export const ChartBarIcon = wrapIcon(Hero_ChartBarIcon, 'ChartBarIcon');
export const ChartBarSquareIcon = wrapIcon(Hero_ChartBarSquareIcon, 'ChartBarSquareIcon');
export const ChatBubbleBottomCenterTextIcon = wrapIcon(Hero_ChatBubbleBottomCenterTextIcon, 'ChatBubbleBottomCenterTextIcon');
export const ChatBubbleLeftRightIcon = wrapIcon(Hero_ChatBubbleLeftRightIcon, 'ChatBubbleLeftRightIcon');
export const ChatBubbleOvalLeftEllipsisIcon = wrapIcon(Hero_ChatBubbleOvalLeftEllipsisIcon, 'ChatBubbleOvalLeftEllipsisIcon');
export const CheckBadgeIcon = wrapIcon(Hero_CheckBadgeIcon, 'CheckBadgeIcon');
export const CheckCircleIcon = wrapIcon(Hero_CheckCircleIcon, 'CheckCircleIcon');
export const CheckIcon = wrapIcon(Hero_CheckIcon, 'CheckIcon');
export const ChevronDownIcon = wrapIcon(Hero_ChevronDownIcon, 'ChevronDownIcon');
export const ChevronLeftIcon = wrapIcon(Hero_ChevronLeftIcon, 'ChevronLeftIcon');
export const ChevronRightIcon = wrapIcon(Hero_ChevronRightIcon, 'ChevronRightIcon');
export const ChevronUpIcon = wrapIcon(Hero_ChevronUpIcon, 'ChevronUpIcon');
export const CircleStackIcon = wrapIcon(Hero_CircleStackIcon, 'CircleStackIcon');
export const ClipboardDocumentCheckIcon = wrapIcon(Hero_ClipboardDocumentCheckIcon, 'ClipboardDocumentCheckIcon');
export const ClipboardDocumentListIcon = wrapIcon(Hero_ClipboardDocumentListIcon, 'ClipboardDocumentListIcon');
export const ClockIcon = wrapIcon(Hero_ClockIcon, 'ClockIcon');
export const CodeBracketIcon = wrapIcon(Hero_CodeBracketIcon, 'CodeBracketIcon');
export const CodeBracketSquareIcon = wrapIcon(Hero_CodeBracketSquareIcon, 'CodeBracketSquareIcon');
export const CommandLineIcon = wrapIcon(Hero_CommandLineIcon, 'CommandLineIcon');
export const ComputerDesktopIcon = wrapIcon(Hero_ComputerDesktopIcon, 'ComputerDesktopIcon');
export const CpuChipIcon = wrapIcon(Hero_CpuChipIcon, 'CpuChipIcon');
export const CreditCardIcon = wrapIcon(Hero_CreditCardIcon, 'CreditCardIcon');
export const CubeIcon = wrapIcon(Hero_CubeIcon, 'CubeIcon');
export const CurrencyDollarIcon = wrapIcon(Hero_CurrencyDollarIcon, 'CurrencyDollarIcon');
export const CurrencyRupeeIcon = wrapIcon(Hero_CurrencyRupeeIcon, 'CurrencyRupeeIcon');
export const CursorArrowRaysIcon = wrapIcon(Hero_CursorArrowRaysIcon, 'CursorArrowRaysIcon');
export const DevicePhoneMobileIcon = wrapIcon(Hero_DevicePhoneMobileIcon, 'DevicePhoneMobileIcon');
export const DocumentDuplicateIcon = wrapIcon(Hero_DocumentDuplicateIcon, 'DocumentDuplicateIcon');
export const DocumentTextIcon = wrapIcon(Hero_DocumentTextIcon, 'DocumentTextIcon');
export const EnvelopeIcon = wrapIcon(Hero_EnvelopeIcon, 'EnvelopeIcon');
export const ExclamationCircleIcon = wrapIcon(Hero_ExclamationCircleIcon, 'ExclamationCircleIcon');
export const ExclamationTriangleIcon = wrapIcon(Hero_ExclamationTriangleIcon, 'ExclamationTriangleIcon');
export const EyeIcon = wrapIcon(Hero_EyeIcon, 'EyeIcon');
export const EyeSlashIcon = wrapIcon(Hero_EyeSlashIcon, 'EyeSlashIcon');
export const FunnelIcon = wrapIcon(Hero_FunnelIcon, 'FunnelIcon');
export const GiftIcon = wrapIcon(Hero_GiftIcon, 'GiftIcon');
export const GlobeAltIcon = wrapIcon(Hero_GlobeAltIcon, 'GlobeAltIcon');
export const HandThumbUpIcon = wrapIcon(Hero_HandThumbUpIcon, 'HandThumbUpIcon');
export const HashtagIcon = wrapIcon(Hero_HashtagIcon, 'HashtagIcon');
export const HeartIcon = wrapIcon(Hero_HeartIcon, 'HeartIcon');
export const HomeIcon = wrapIcon(Hero_HomeIcon, 'HomeIcon');
export const InboxIcon = wrapIcon(Hero_InboxIcon, 'InboxIcon');
export const InformationCircleIcon = wrapIcon(Hero_InformationCircleIcon, 'InformationCircleIcon');
export const KeyIcon = wrapIcon(Hero_KeyIcon, 'KeyIcon');
export const LanguageIcon = wrapIcon(Hero_LanguageIcon, 'LanguageIcon');
export const LinkIcon = wrapIcon(Hero_LinkIcon, 'LinkIcon');
export const ListBulletIcon = wrapIcon(Hero_ListBulletIcon, 'ListBulletIcon');
export const LockClosedIcon = wrapIcon(Hero_LockClosedIcon, 'LockClosedIcon');
export const MagnifyingGlassIcon = wrapIcon(Hero_MagnifyingGlassIcon, 'MagnifyingGlassIcon');
export const MagnifyingGlassPlusIcon = wrapIcon(Hero_MagnifyingGlassPlusIcon, 'MagnifyingGlassPlusIcon');
export const MapPinIcon = wrapIcon(Hero_MapPinIcon, 'MapPinIcon');
export const MinusIcon = wrapIcon(Hero_MinusIcon, 'MinusIcon');
export const PaperAirplaneIcon = wrapIcon(Hero_PaperAirplaneIcon, 'PaperAirplaneIcon');
export const PencilIcon = wrapIcon(Hero_PencilIcon, 'PencilIcon');
export const PencilSquareIcon = wrapIcon(Hero_PencilSquareIcon, 'PencilSquareIcon');
export const PercentBadgeIcon = wrapIcon(Hero_PercentBadgeIcon, 'PercentBadgeIcon');
export const PhoneIcon = wrapIcon(Hero_PhoneIcon, 'PhoneIcon');
export const PhotoIcon = wrapIcon(Hero_PhotoIcon, 'PhotoIcon');
export const PlayIcon = wrapIcon(Hero_PlayIcon, 'PlayIcon');
export const PlusIcon = wrapIcon(Hero_PlusIcon, 'PlusIcon');
export const PowerIcon = wrapIcon(Hero_PowerIcon, 'PowerIcon');
export const PrinterIcon = wrapIcon(Hero_PrinterIcon, 'PrinterIcon');
export const QrCodeIcon = wrapIcon(Hero_QrCodeIcon, 'QrCodeIcon');
export const QuestionMarkCircleIcon = wrapIcon(Hero_QuestionMarkCircleIcon, 'QuestionMarkCircleIcon');
export const ScaleIcon = wrapIcon(Hero_ScaleIcon, 'ScaleIcon');
export const ServerIcon = wrapIcon(Hero_ServerIcon, 'ServerIcon');
export const ShareIcon = wrapIcon(Hero_ShareIcon, 'ShareIcon');
export const ShieldCheckIcon = wrapIcon(Hero_ShieldCheckIcon, 'ShieldCheckIcon');
export const ShieldExclamationIcon = wrapIcon(Hero_ShieldExclamationIcon, 'ShieldExclamationIcon');
export const ShoppingBagIcon = wrapIcon(Hero_ShoppingBagIcon, 'ShoppingBagIcon');
export const SparklesIcon = wrapIcon(Hero_SparklesIcon, 'SparklesIcon');
export const SpeakerWaveIcon = wrapIcon(Hero_SpeakerWaveIcon, 'SpeakerWaveIcon');
export const Square3Stack3DIcon = wrapIcon(Hero_Square3Stack3DIcon, 'Square3Stack3DIcon');
export const Squares2X2Icon = wrapIcon(Hero_Squares2X2Icon, 'Squares2X2Icon');
export const StarIcon = wrapIcon(Hero_StarIcon, 'StarIcon');
export const StopIcon = wrapIcon(Hero_StopIcon, 'StopIcon');
export const SunIcon = wrapIcon(Hero_SunIcon, 'SunIcon');
export const SwatchIcon = wrapIcon(Hero_SwatchIcon, 'SwatchIcon');
export const TableCellsIcon = wrapIcon(Hero_TableCellsIcon, 'TableCellsIcon');
export const TagIcon = wrapIcon(Hero_TagIcon, 'TagIcon');
export const TrashIcon = wrapIcon(Hero_TrashIcon, 'TrashIcon');
export const TrophyIcon = wrapIcon(Hero_TrophyIcon, 'TrophyIcon');
export const TruckIcon = wrapIcon(Hero_TruckIcon, 'TruckIcon');
export const UserIcon = wrapIcon(Hero_UserIcon, 'UserIcon');
export const UserPlusIcon = wrapIcon(Hero_UserPlusIcon, 'UserPlusIcon');
export const UsersIcon = wrapIcon(Hero_UsersIcon, 'UsersIcon');
export const XMarkIcon = wrapIcon(Hero_XMarkIcon, 'XMarkIcon');
