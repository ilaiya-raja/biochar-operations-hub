import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  FlameIcon, 
  HomeIcon, 
  Leaf, 
  MapPin, 
  PackageIcon, 
  SproutIcon, 
  Users, 
  UserCog,
  Trees,
  Tractor,
  Truck,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('Current user role in Sidebar:', userRole);
  }, [userRole]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { 
      name: 'Master Management', 
      children: [
        { name: 'Biomass Master', href: '/biomass', icon: Leaf },
        { name: 'Biomass Types', href: '/biomass-types', icon: Trees },
        { name: 'Location Master', href: '/locations', icon: MapPin },
        { name: 'Coordinator Master', href: '/coordinators', icon: UserCog },
        { name: 'Farmer Master', href: '/farmers', icon: Users },
        { name: 'Kiln Master', href: '/kilns', icon: FlameIcon },
      ]
    },
    ...(userRole === 'coordinator' ? [
      { name: 'Biomass Collection', href: '/biomass-collection', icon: Leaf },
      { name: 'Pyrolysis Process', href: '/pyrolysis', icon: FlameIcon },
      { name: 'Biochar Fertilizer', href: '/fertilizer', icon: Tractor },
      { name: 'Fertilizer Distribution', href: '/fertilizer-distribution', icon: Truck },
    ] : [])
  ];
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    if (!collapsed) {
      // Simultaneously collapse sidebar and fade out text
      setCollapsed(true);
      setTextVisible(false);
    } else {
      // Expand sidebar and show text
      setCollapsed(false);
      // Short delay before showing text for smoother transition
      setTimeout(() => {
        setTextVisible(true);
      }, 150);
    }
  };

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col bg-sidebar border-r border-sidebar-border",
        "transition-all duration-300 ease-in-out h-screen overflow-hidden", // Added overflow-hidden
        collapsed ? "w-20" : "w-75",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:sticky md:top-0" // Changed from md:relative to md:sticky
      )}
    >
      {/* Header without toggle button */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-3">
        <div className={cn(
          "flex items-center text-sidebar-foreground transition-all duration-300", 
          collapsed ? "justify-center w-full" : "gap-2"
        )}>
          <PackageIcon className="h-6 w-6 flex-shrink-0 text-sidebar-primary" />
          <span className={cn(
            "text-xl font-semibold whitespace-nowrap transition-all duration-300",
            collapsed ? "opacity-0 w-0" : "opacity-100 ml-2"
          )}>
            Carbon Roots
          </span>
        </div>
      </div>

      {/* Main navigation content */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className={cn("space-y-1", collapsed ? "px-1" : "px-3")}>
          {navigation.map((item) => {
            if (item.children) {
              return (
                <div key={item.name} className="space-y-1 pt-2">
                  {!collapsed && (
                    <h3 className={cn(
                      "px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70",
                      "whitespace-nowrap overflow-hidden transition-all duration-300",
                      !textVisible && "opacity-0"
                    )}>
                      {item.name}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {item.children.map((child) => {
                      const isActive = location.pathname === child.href;
                      return (
                        <button
                          key={child.name}
                          className={cn(
                            "group flex items-center rounded-md py-2 overflow-hidden",
                            collapsed ? "w-full justify-center px-1" : "w-full px-3",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                          onClick={() => handleNavigation(child.href)}
                          title={collapsed ? child.name : ""}
                        >
                          <child.icon className={cn("h-5 w-5 flex-shrink-0", !collapsed && "mr-3")} />
                          <span className={cn(
                            "text-sm font-medium whitespace-nowrap transition-all duration-300",
                            collapsed ? "opacity-0 w-0" : "opacity-100"
                          )}>
                            {child.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = location.pathname === item.href;
            return (
              <button
                key={item.name}
                className={cn(
                  "group flex items-center rounded-md py-2 overflow-hidden",
                  collapsed ? "w-full justify-center px-1" : "w-full px-3",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
                onClick={() => handleNavigation(item.href)}
                title={collapsed ? item.name : ""}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", !collapsed && "mr-3")} />
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap transition-all duration-300",
                  collapsed ? "opacity-0 w-0" : "opacity-100"
                )}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* New footer with toggle button */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        <button 
          onClick={toggleSidebar}
          className={cn(
            "w-full p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/50",
            "transition-all duration-300 ease-in-out flex items-center",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {!collapsed && <span className="text-sm">Close the Sidebar</span>}
          {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
};