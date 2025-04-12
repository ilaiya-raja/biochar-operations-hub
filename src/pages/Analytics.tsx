
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { Spinner } from '@/components/Spinner';
import { activityService, locationService } from '@/services/supabase-service';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#4ECDC4'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const [activityData, setActivityData] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [biomassData, setBiomassData] = useState<any[]>([]);
  const [biocharData, setBiocharData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch locations for the filter
        const locationsData = await locationService.getLocations();
        setLocations(locationsData || []);
        
        // Fetch activities for analytics
        const activitiesData = await activityService.getActivities();
        
        if (activitiesData) {
          processActivityData(activitiesData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedLocation, date]);

  const processActivityData = (activities: any[]) => {
    // Filter activities based on selected location and date range
    let filteredActivities = activities;
    
    if (selectedLocation !== 'all') {
      filteredActivities = filteredActivities.filter(a => a.location_id === selectedLocation);
    }
    
    if (date?.from) {
      const fromDate = new Date(date.from);
      fromDate.setHours(0, 0, 0, 0);
      filteredActivities = filteredActivities.filter(a => new Date(a.date_performed) >= fromDate);
    }
    
    if (date?.to) {
      const toDate = new Date(date.to);
      toDate.setHours(23, 59, 59, 999);
      filteredActivities = filteredActivities.filter(a => new Date(a.date_performed) <= toDate);
    }

    // Process data for activity type chart
    const activityTypeCounts: Record<string, number> = {};
    filteredActivities.forEach(activity => {
      const type = activity.activity_type;
      activityTypeCounts[type] = (activityTypeCounts[type] || 0) + 1;
    });
    
    const activityChartData = Object.keys(activityTypeCounts).map(type => ({
      name: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: activityTypeCounts[type]
    }));
    setActivityData(activityChartData);

    // Process data for location chart
    const locationCounts: Record<string, number> = {};
    filteredActivities.forEach(activity => {
      if (activity.location) {
        const locationName = activity.location.name;
        locationCounts[locationName] = (locationCounts[locationName] || 0) + 1;
      }
    });
    
    const locationChartData = Object.keys(locationCounts).map(location => ({
      name: location,
      value: locationCounts[location]
    }));
    setLocationData(locationChartData);

    // Process biomass collection data
    const biomassActivities = filteredActivities.filter(a => 
      a.activity_type === 'biomass_collection' && a.quantity
    );
    
    const biomassChartData: Record<string, number> = {};
    biomassActivities.forEach(activity => {
      const date = new Date(activity.date_performed).toLocaleDateString();
      biomassChartData[date] = (biomassChartData[date] || 0) + (activity.quantity || 0);
    });
    
    const biomassDataArray = Object.keys(biomassChartData).map(date => ({
      date,
      amount: biomassChartData[date]
    }));
    setBiomassData(biomassDataArray);

    // Process biochar production data
    const biocharActivities = filteredActivities.filter(a => 
      a.activity_type === 'biochar_production' && a.quantity
    );
    
    const biocharChartData: Record<string, number> = {};
    biocharActivities.forEach(activity => {
      const date = new Date(activity.date_performed).toLocaleDateString();
      biocharChartData[date] = (biocharChartData[date] || 0) + (activity.quantity || 0);
    });
    
    const biocharDataArray = Object.keys(biocharChartData).map(date => ({
      date,
      amount: biocharChartData[date]
    }));
    setBiocharData(biocharDataArray);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize biochar operation metrics and performance.
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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity Types</CardTitle>
              <CardDescription>
                Distribution of activities by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {activityData.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No activity data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activities by Location</CardTitle>
              <CardDescription>
                Number of activities performed at each location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {locationData.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No location data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={locationData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 70,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Activities" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biomass Collection</CardTitle>
              <CardDescription>
                Biomass collected over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {biomassData.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No biomass data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={biomassData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 70,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" name="Quantity" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biochar Production</CardTitle>
              <CardDescription>
                Biochar produced over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {biocharData.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No biochar data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={biocharData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 70,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" name="Quantity" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;
