import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  CalendarIcon, 
  Leaf, 
  Loader2, 
  Users,
  FlameIcon,
  SproutIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/Spinner';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/DatePicker';
import { addDays, format, subDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [stats, setStats] = useState({
    biomassCollected: '0',
    pyrolysisBatches: '0',
    biocharFertilizer: '0',
    farmerParticipation: '0',
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name');
          
        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    const fetchStats = async () => {
      setLoading(true);
      
      try {
        setTimeout(() => {
          setStats({
            biomassCollected: '1,250 kg',
            pyrolysisBatches: '42',
            biocharFertilizer: '850 kg',
            farmerParticipation: '36',
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchLocations();
    fetchStats();
  }, [selectedLocation, date]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your biochar operations.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <DatePicker date={date} setDate={setDate} />
          <Select
            value={selectedLocation}
            onValueChange={setSelectedLocation}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Biomass Collected
            </CardTitle>
            <Leaf className="h-4 w-4 text-biochar-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-12 items-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.biomassCollected}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pyrolysis Batches
            </CardTitle>
            <FlameIcon className="h-4 w-4 text-earth-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-12 items-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.pyrolysisBatches}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Biochar Fertilizer
            </CardTitle>
            <SproutIcon className="h-4 w-4 text-biochar-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-12 items-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.biocharFertilizer}</div>
                <p className="text-xs text-muted-foreground">
                  +15.3% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Farmer Participation
            </CardTitle>
            <Users className="h-4 w-4 text-biochar-400" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-12 items-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.farmerParticipation}</div>
                <p className="text-xs text-muted-foreground">
                  +7% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <div className="h-64 rounded-md bg-muted/40 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Activity chart will be displayed here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="mt-px rounded-full bg-biochar-100 p-1">
                    <CalendarIcon className="h-4 w-4 text-biochar-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Biomass Collection</p>
                    <p className="text-xs text-muted-foreground">
                      East Region • Apr 18, 2025
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="mt-px rounded-full bg-biochar-100 p-1">
                    <FlameIcon className="h-4 w-4 text-earth-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pyrolysis Training</p>
                    <p className="text-xs text-muted-foreground">
                      South Region • Apr 20, 2025
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="mt-px rounded-full bg-biochar-100 p-1">
                    <BarChart3 className="h-4 w-4 text-biochar-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Quarterly Review</p>
                    <p className="text-xs text-muted-foreground">
                      Online • Apr 30, 2025
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
