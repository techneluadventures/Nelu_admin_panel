'use client';
import { useState } from 'react';
import Navbar from '../../../../components/Navbar';
import { api } from '../../../../lib/api';

export default function NewQuotation() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    property_name: '',
    date: new Date().toLocaleDateString('en-GB'),
    gst_percent: 18,
    installation_charges: 0,
  });
  
  const [products, setProducts] = useState([
    { name: '', quantity: 1, price: 0 }
  ]);

  const addProduct = () => setProducts([...products, { name: '', quantity: 1, price: 0 }]);
  
  const updateProduct = (index, field, value) => {
    const newProducts = [...products];
    newProducts[index][field] = value;
    setProducts(newProducts);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  // Live Totals Calculation
  const subtotal = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const gstAmount = (subtotal + Number(formData.installation_charges)) * (formData.gst_percent / 100);
  const grandTotal = subtotal + Number(formData.installation_charges) + gstAmount;

  const generatePDF = async () => {
    try {
      setLoading(true);
      const res = await api.crm.quotations.generate({
        ...formData,
        products
      });
      
      // Download the base64 PDF
      const linkSource = `data:application/pdf;base64,${res.pdf}`;
      const downloadLink = document.createElement("a");
      const fileName = `Quotation_${formData.client_name.replace(/\s+/g, '_')}.pdf`;
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
      
    } catch (err) {
      alert("Failed to generate PDF: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate Quotation</h1>
          <p className="text-sm text-gray-500 mt-1">Create a beautifully branded Nelu Adventures PDF quotation instantly.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#FC922E] focus:border-[#FC922E]" placeholder="Rahul Sharma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
              <input value={formData.property_name} onChange={e => setFormData({...formData, property_name: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#FC922E] focus:border-[#FC922E]" placeholder="Ananda Resort" />
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Products / Services</h3>
          {products.map((p, i) => (
            <div key={i} className="flex gap-3 mb-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input value={p.name} onChange={e => updateProduct(i, 'name', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#FC922E] focus:border-[#FC922E]" placeholder="Zipline Standard Setup" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                <input type="number" value={p.quantity} onChange={e => updateProduct(i, 'quantity', Number(e.target.value))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#FC922E] focus:border-[#FC922E]" />
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price (₹)</label>
                <input type="number" value={p.price} onChange={e => updateProduct(i, 'price', Number(e.target.value))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#FC922E] focus:border-[#FC922E]" />
              </div>
              <button onClick={() => removeProduct(i)} className="text-red-500 p-2 hover:bg-red-50 rounded mb-1">
                ✕
              </button>
            </div>
          ))}
          <button onClick={addProduct} className="text-sm text-[#FC922E] font-medium mt-2 hover:underline">
            + Add Product
          </button>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installation & Logistics Charges (₹)</label>
              <input type="number" value={formData.installation_charges} onChange={e => setFormData({...formData, installation_charges: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#FC922E] focus:border-[#FC922E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Percentage</label>
              <select value={formData.gst_percent} onChange={e => setFormData({...formData, gst_percent: Number(e.target.value)})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[#FC922E] focus:border-[#FC922E]">
                <option value="18">18%</option>
                <option value="5">5%</option>
                <option value="0">0%</option>
              </select>
            </div>
          </div>

          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-800 mb-3 border-b border-orange-200 pb-2">Quotation Summary</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span>Subtotal:</span> <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Installation & Logistics:</span> <span className="font-medium">₹{Number(formData.installation_charges).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>GST ({formData.gst_percent}%):</span> <span className="font-medium">₹{gstAmount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-orange-200 pt-2 mt-2">
                <span>Grand Total:</span> <span className="text-[#FC922E]">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={generatePDF} disabled={loading} className="px-6 py-3 bg-[#FC922E] text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 shadow-md transition-all">
            {loading ? 'Generating PDF...' : 'Download Quotation PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
