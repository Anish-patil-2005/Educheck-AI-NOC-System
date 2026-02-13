import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { HardHat, Wrench, ArrowLeft, Eye } from 'lucide-react';

interface UnderConstructionPageProps {
    onBack: () => void;
}

export function UnderConstructionPage({ onBack }: UnderConstructionPageProps) {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="bg-white border-b px-6 py-4">
                <Button variant="ghost" onClick={onBack} className="mb-2  shadow-sm bg-blue-500 text-white"><Eye className="w-4 h-4 mr-2 " />Back</Button>
            </div>

            <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 150px)' }}>
                <Card className="w-full max-w-lg text-center shadow-lg border-0">
                    <CardContent className="p-8 md:p-12">
                        <div className="flex justify-center items-center mb-6">
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                                <HardHat className="w-10 h-10 text-yellow-500" strokeWidth={1.5} />
                            </div>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-4">
                            Feature Under Construction
                        </h2>

                        <p className="mt-3 text-gray-600">
                            Our team is hard at work building this module. Please check back soon for updates.
                            We appreciate your patience!
                        </p>

                        <div className="mt-8 flex items-center justify-center gap-4">
                            <Wrench className="w-5 h-5 text-gray-400" />
                            <p className="text-sm text-gray-500 font-medium">Coming Soon</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
