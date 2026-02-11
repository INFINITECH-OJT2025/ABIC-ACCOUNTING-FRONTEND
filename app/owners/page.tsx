"use client"


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Menu,
  User,
  Search,
  RefreshCcw,
  Download,
  Printer,
  Eye,
} from "lucide-react"
import { useState } from "react"


export default function OwnersAccountUI() {


  /* ---------------- SUPER ADMIN SETTINGS SIMULATION ---------------- */
  const showProof = true
  const showPIC = true


  /* ---------------- DUMMY DATA ---------------- */
  const transactions = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
  }))


  /* ---------------- PAGINATION ---------------- */
  const rowsPerPage = 15
  const [currentPage, setCurrentPage] = useState(1)


  const totalPages = Math.ceil(transactions.length / rowsPerPage)


  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRows = transactions.slice(startIndex, endIndex)


  return (
    <div className="min-h-screen flex flex-col bg-white">


      {/* HEADER */}
      <div className="bg-[#7B0F2B] text-white shadow-md">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Menu className="w-6 h-6 cursor-pointer" />
            <h1 className="text-lg md:text-2xl font-semibold tracking-wide">
              ABIC Realty & Consultancy Corporation 2026
            </h1>
          </div>
          <User className="w-7 h-7 cursor-pointer" />
        </div>


        {/* NAV */}
        <div className="hidden md:flex bg-[#6A0D25] text-sm px-6">
          {[
            "Owner Accounts",
            "Banks",
            "Accounting Accounts",
            "Roles",
            "Activity Log",
            "Reports",
            "Support",
          ].map((item, index) => (
            <div
              key={index}
              className="px-6 py-3 border-r border-[#8E1B3E] hover:bg-[#5E0C20] cursor-pointer transition"
            >
              {item}
            </div>
          ))}
        </div>
      </div>


      {/* CONTENT */}
      <div className="flex-1 p-6 space-y-6">


        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-[#7B0F2B]">
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Account Name:</span> ---</p>
              <p><span className="font-medium">Account Number:</span> ---</p>
            </CardContent>
          </Card>


          <Card className="rounded-2xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-[#7B0F2B]">
                Fund Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Starting Fund:</span> ----</p>
              <p><span className="font-medium">Running Balance:</span> ----</p>
            </CardContent>
          </Card>
        </div>


       {/* SEARCH + ACTION BAR */}
<Card className="rounded-2xl shadow-md border-none">
  <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5">
    {/* SEARCH */}
    <div className="relative w-full md:w-1/3">
      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
      <Input
        placeholder="Search voucher no., particulars..."
        className="pl-9"
      />
    </div>


    {/* ACTION BUTTONS */}
    <div className="flex gap-3 flex-wrap justify-start md:justify-end">
      <Button
        variant="outline"
        className="rounded-xl hover:bg-gray-200 transition"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
        Refresh
      </Button>


      <Button className="bg-[#7B0F2B] hover:bg-[#5E0C20] text-white rounded-xl transition">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>


      <Button
        variant="outline"
        className="rounded-xl hover:bg-gray-100 transition"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print
      </Button>


      <Button
        variant="outline"
        className="rounded-xl hover:bg-gray-100 transition"
      >
        <Eye className="w-4 h-4 mr-2" />
        View
      </Button>
    </div>
  </CardContent>


  {/* TABLE */}
  <CardContent className="p-0 overflow-x-auto">
    <Table className="min-w-[800px] md:min-w-full">
      <TableHeader className="bg-gray-50">
        <TableRow>
          <TableHead>Voucher Date</TableHead>
          <TableHead>Voucher No.</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Account Source</TableHead>
          <TableHead>Particulars</TableHead>
          <TableHead className="text-green-600">Deposit</TableHead>
          <TableHead className="text-red-600">Withdrawal</TableHead>
          <TableHead>Outstanding Balance</TableHead>
          {showProof && (
            <TableHead>
              Proof
              <p className="text-xs font-normal text-gray-500">
                Fund References
              </p>
            </TableHead>
          )}
          {showPIC && <TableHead>Person In Charge</TableHead>}
        </TableRow>
      </TableHeader>


      <TableBody>
        {currentRows.map((row, idx) => (
          <TableRow
            key={idx}
            className="hover:bg-gray-50 transition"
          >
            <TableCell>--/--/----</TableCell>
            <TableCell>------</TableCell>
            <TableCell>----</TableCell>
            <TableCell>---</TableCell>
            <TableCell>------</TableCell>
            <TableCell>₱-----</TableCell>
            <TableCell>₱-----</TableCell>
            <TableCell>₱-----</TableCell>
            {showProof && (
              <TableCell>
                <span className="text-[#7B0F2B] underline cursor-pointer hover:text-[#5E0C20] transition">
                  View File
                </span>
              </TableCell>
            )}
            {showPIC && <TableCell>--------</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>


    {/* PAGINATION */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-600 mt-3 px-4 py-2">
      {/* LEFT */}
      <p className="text-center md:text-left">
        Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
        <span className="font-medium">
          {Math.min(endIndex, transactions.length)}
        </span>{" "}
        of <span className="font-medium">{transactions.length}</span> transactions
      </p>


      {/* RIGHT */}
      <div className="flex flex-wrap justify-center md:justify-end items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Previous
        </Button>


        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1
          const isActive = currentPage === page


          return (
            <Button
              key={page}
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
              className={`rounded-xl ${
                isActive
                  ? "bg-[#7B0F2B] text-white"
                  : ""
              }`}
            >
              {page}
            </Button>
          )
        })}


        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  </CardContent>
</Card>




      </div>


      {/* FOOTER */}
<footer className="bg-[#7B0F2B] text-white">
  <div className=" max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs">
   
    <p className="tracking-wide">
      © 2026 ABIC Realty & Consultancy Corporation
    </p>


    <p className="opacity-80">
      All Rights Reserved
    </p>


  </div>
</footer>


    </div>
  )
}



