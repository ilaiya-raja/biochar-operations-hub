
import React from 'react';
import { Flame, Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Kiln } from '@/services/supabase-service';

interface KilnTableProps {
  kilns: Kiln[];
  onEdit: (kiln: Kiln) => void;
  onDelete: (kiln: Kiln) => void;
}

const KilnTable = ({ kilns, onEdit, onDelete }: KilnTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Capacity</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Coordinator</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {kilns.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">
              No kilns found
            </TableCell>
          </TableRow>
        ) : (
          kilns.map((kiln) => (
            <TableRow key={kiln.id}>
              <TableCell className="font-mono text-xs">{kiln.id.slice(0, 8)}</TableCell>
              <TableCell className="font-medium">{kiln.name}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <Flame className="mr-2 h-4 w-4 text-orange-500" />
                  {kiln.type || '-'}
                </div>
              </TableCell>
              <TableCell>
                {kiln.capacity ? `${kiln.capacity} ${kiln.capacity_unit || 'units'}` : '-'}
              </TableCell>
              <TableCell>{kiln.location?.name || '-'}</TableCell>
              <TableCell>{kiln.coordinator?.name || '-'}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  kiln.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {kiln.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(kiln)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(kiln)}
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

export default KilnTable;
