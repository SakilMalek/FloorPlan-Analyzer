// frontend/src/components/DataTable.js

import React from 'react';

const DataTable = ({ data, setData, highlightedRow, setHighlightedRow }) => {
    const handleEdit = (index, field, value) => {
        const newData = [...data];
        newData[index][field] = value;
        setData(newData);
    };

    if (!data || data.length === 0) {
        return (
             <div className="flex items-center justify-center h-full bg-white rounded-lg shadow-md">
                <p className="text-gray-500">Analysis data will appear here</p>
            </div>
        )
    }

    return (
        // UPDATED: Added h-full to make this div fill its parent container
        <div className="h-full overflow-auto bg-white rounded-lg shadow-md">
            <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-800 uppercase bg-gray-100 sticky top-0 z-10">
                    <tr>
                        <th scope="col" className="px-6 py-3">Room</th>
                        <th scope="col" className="px-6 py-3">Object</th>
                        <th scope="col" className="px-6 py-3">Width (m)</th>
                        <th scope="col" className="px-6 py-3">Height (m)</th>
                        <th scope="col" className="px-6 py-3">Area (m²)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <tr 
                            key={index} 
                            className={`transition-colors duration-150 ${highlightedRow === index ? 'bg-yellow-100' : 'bg-white hover:bg-gray-50'}`}
                            onMouseEnter={() => setHighlightedRow(index)}
                        >
                            <td className="px-6 py-4">
                                <input 
                                    type="text" 
                                    value={item.room} 
                                    onChange={(e) => handleEdit(index, 'room', e.target.value)}
                                    className="bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                />
                            </td>
                            <td className="px-6 py-4">
                               <input 
                                    type="text" 
                                    value={item.object_class}
                                    onChange={(e) => handleEdit(index, 'object_class', e.target.value)}
                                    className="bg-transparent w-full focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                />
                            </td>
                            <td className="px-6 py-4">{item.width_m}</td>
                            <td className="px-6 py-4">{item.height_m}</td>
                            <td className="px-6 py-4 font-medium">{(item.width_m * item.height_m).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
