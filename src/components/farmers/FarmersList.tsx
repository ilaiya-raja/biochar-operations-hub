
import React from 'react';
import { Users, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/Spinner';
import { Farmer } from '@/types/farmer';

interface FarmersListProps {
  farmers: Farmer[];
  loading: boolean;
  searchQuery: string;
  onEdit: (farmer: Farmer) => void;
  onDelete: (farmer: Farmer) => void;
}

export const FarmersList: React.FC<FarmersListProps> = ({
  farmers,
  loading,
  searchQuery,
  onEdit,
  onDelete
}) => {
  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (farmer.phone && farmer.phone.includes(searchQuery)) ||
    (farmer.email && farmer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (farmer.location?.name && farmer.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (farmer.coordinator?.name && farmer.coordinator.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Farmer ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Coordinator</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredFarmers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              No farmers found
            </TableCell>
          </TableRow>
        ) : (
          filteredFarmers.map((farmer) => (
            <TableRow key={farmer.id}>
              <TableCell className="font-mono text-xs">{farmer.id.slice(0, 8)}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  {farmer.name}
                </div>
              </TableCell>
              <TableCell>{farmer.phone}</TableCell>
              <TableCell>{farmer.location?.name || '-'}</TableCell>
              <TableCell>{farmer.coordinator?.name || '-'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(farmer)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(farmer)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
