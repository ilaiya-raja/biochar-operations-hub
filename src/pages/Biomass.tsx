
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf } from "lucide-react";

const Biomass = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Biomass Management</h1>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Biomass Types</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biomass Types</CardTitle>
              <CardDescription>
                Manage all types of biomass collected for biochar production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {["Rice Husk", "Coconut Shell", "Bamboo Waste", "Agricultural Residue"].map((type) => (
                  <Card key={type} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{type}</CardTitle>
                        <Leaf className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Used in biochar production
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Biomass Types</CardTitle>
              <CardDescription>
                Currently active biomass types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Active biomass types content will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archived" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Archived Biomass Types</CardTitle>
              <CardDescription>
                Archived or inactive biomass types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Archived biomass types content will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Biomass;
