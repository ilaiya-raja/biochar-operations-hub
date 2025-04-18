
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
  UserCog
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, isLoading } = useAuth();

  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { 
      name: 'Master Management', 
      children: [
        { name: 'Biomass Master', href: '/biomass', icon: Leaf },
        { name: 'Location Master', href: '/locations', icon: MapPin },
        { name: 'Coordinator Master', href: '/coordinators', icon: UserCog },
        { name: 'Farmer Master', href: '/farmers', icon: Users },
        { name: 'Kiln Master', href: '/kilns', icon: FlameIcon },
      ]
    },
    { name: 'Biochar Fertilizer', href: '/fertilizer', icon: SproutIcon },
  ];

  const coordinatorNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Biomass Collection', href: '/biomass-collection', icon: Leaf },
    { name: 'Pyrolysis Process', href: '/pyrolysis', icon: FlameIcon },
    { name: 'Fertilizer Distribution', href: '/fertilizer-distribution', icon: SproutIcon },
  ];

  // Use coordinator navigation if userRole is coordinator, otherwise use admin navigation
  const navigation = userRole === 'coordinator' ? coordinatorNavigation : adminNavigation;
  
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <PackageIcon className="h-6 w-6 text-sidebar-primary" />
            <span className="text-xl font-semibold">Biochar Hub</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 flex justify-center items-center">
          <p className="text-sidebar-foreground">Loading...</p>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0"
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <PackageIcon className="h-6 w-6 text-sidebar-primary" />
          <span className="text-xl font-semibold">Biochar Hub</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            if (item.children) {
              return (
                <div key={item.name} className="space-y-1 pt-2">
                  <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                    {item.name}
                  </h3>
                  <div className="space-y-1">
                    {item.children.map((child) => {
                      const isActive = location.pathname === child.href;
                      return (
                        <button
                          key={child.name}
                          className={cn(
                            "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                          onClick={() => handleNavigation(child.href)}
                        >
                          <child.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          {child.name}
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
                  "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
