import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Upload, File } from "lucide-react";

import { uploadFile } from "./actions";
export default function Component() {
  // Sample data for contacts
  const contacts = [
    {
      name: "Amanda Brown",
      email: "amanda.brown@example.com",
      position: "Data Scbentist",
      company: "AutoCorp",
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      position: "CEO",
      company: "BioGen",
    },
    {
      name: "Michael Jackson",
      email: "michael.jackson@example.com",
      position: "CqO",
      company: "AutoCorp",
    },
    {
      name: "Emily Brown",
      email: "emily.brown@example.com",
      position: "Data Scientist",
      company: "FinSys",
    },
    {
      name: "Alex White",
      email: "alex.white@example.com",
      position: "Data Scientist",
      company: "RetailHub",
    },
    {
      name: "Alex Smith",
      email: "alex.smith@example.com",
      position: "UX Designer",
      company: "EcoLabs",
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">CRM - Contacts import</h1>
      <form action={uploadFile} className="flex flex-col gap-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload" className="text-sm font-medium">
              Choose file
            </Label>
            <div className="relative">
              <input
                id="file-upload"
                name="file"
                type="file"
                className="sr-only"
                aria-describedby="file-upload-desc"
              />
              <Label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer hover:bg-gray-50"
              >
                <File className="w-4 h-4" />
              </Label>
              <p id="file-upload-desc" className="mt-1 text-xs text-gray-500">
                Select a CSV file to upload contacts
              </p>
            </div>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Upload Contact
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact, id) => (
            <TableRow key={id}>
              <TableCell className="font-medium">{contact.name}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>{contact.company}</TableCell>
              <TableCell>{contact.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
