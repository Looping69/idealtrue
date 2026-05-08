import { useEffect, useMemo, useRef, useState } from "react";
import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/google-maps";

interface GoogleCoordinatePickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

const defaultCenter = { lat: -29.8587, lng: 31.0218 };

export default function GoogleCoordinatePicker({
  value,
  onChange,
  className = "h-[300px] w-full rounded-xl border border-outline-variant",
}: GoogleCoordinatePickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const listenerRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const hasGoogleMapsKey = useMemo(() => Boolean(getGoogleMapsApiKey()), []);

  useEffect(() => {
    if (!mapRef.current || !hasGoogleMapsKey) {
      return;
    }

    let cancelled = false;

    void loadGoogleMapsScript()
      .then(() => {
        if (cancelled || !mapRef.current || !window.google?.maps) {
          return;
        }

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            center: value ?? defaultCenter,
            zoom: value ? 15 : 7,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            gestureHandling: "greedy",
          });
        }

        listenerRef.current?.remove();
        listenerRef.current = mapInstanceRef.current.addListener("click", (event: any) => {
          if (!event.latLng) {
            return;
          }

          onChange({
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          });
        });

        setMapError(null);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load Google Maps picker:", error);
          setMapError("Google Maps could not be loaded right now.");
        }
      });

    return () => {
      cancelled = true;
      listenerRef.current?.remove();
    };
  }, [hasGoogleMapsKey, onChange, value]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) {
      return;
    }

    if (!value) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      map.setCenter(defaultCenter);
      map.setZoom(7);
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new window.google.maps.Marker({
        map,
        position: value,
      });
    } else {
      markerRef.current.setPosition(value);
    }

    map.panTo(value);
    map.setZoom(15);
  }, [value]);

  if (!hasGoogleMapsKey) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-surface-container-low p-4 text-center text-sm text-on-surface-variant ${className}`}>
        Add `VITE_GOOGLE_MAPS_API_KEY` to use the Google location picker.
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-surface-container-low p-4 text-center text-sm text-on-surface-variant ${className}`}>
        {mapError}
      </div>
    );
  }

  return <div ref={mapRef} className={`${className} overflow-hidden`} />;
}
