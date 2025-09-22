import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Html5QrcodeScanner } from "html5-qrcode";

const BarcodeScannerDialog = ({ onClose, onScanSuccess }) => {
    const scannerRef = useRef(null);
    const scannerInstanceRef = useRef(null);

    useEffect(() => {
        // This effect runs only once when the component mounts
        const timer = setTimeout(() => {
            if (!scannerRef.current) {
                console.error("Scanner element with id 'reader' not found.");
                return;
            }

            try {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        qrbox: { width: 250, height: 150 },
                        fps: 10,
                        rememberLastUsedCamera: true,
                    },
                    false // verbose
                );

                const handleSuccess = (decodedText, decodedResult) => {
                    if (scannerInstanceRef.current) {
                        scannerInstanceRef.current.clear().then(() => {
                            onScanSuccess(decodedText);
                        }).catch(error => {
                            console.error("Scanner clear failed on success:", error);
                            onScanSuccess(decodedText); // Proceed even if clear fails
                        });
                    }
                };

                const handleError = (error) => {
                    // We can ignore continuous scanning errors
                };

                scanner.render(handleSuccess, handleError);
                scannerInstanceRef.current = scanner;

            } catch (error) {
                console.error("Failed to initialize Html5QrcodeScanner:", error);
            }

        }, 100); // 100ms delay to ensure the DOM is ready

        // This is the cleanup function that runs when the component unmounts
        return () => {
            clearTimeout(timer);
            if (scannerInstanceRef.current) {
                scannerInstanceRef.current.clear().catch(error => {
                    console.error("Failed to clear scanner on unmount:", error);
                });
            }
        };
    }, [onScanSuccess]);

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Scan Animal Tag</DialogTitle>
                    <DialogDescription>
                        Point your camera at the barcode on the ear tag.
                    </DialogDescription>
                </DialogHeader>
                <div ref={scannerRef} id="reader" style={{ width: "100%", minHeight: "300px" }}></div>
                <DialogFooter className="pt-4 border-t mt-4">
                    <Button className="w-full" variant="secondary" onClick={onClose}>
                        Cancel Scan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BarcodeScannerDialog;