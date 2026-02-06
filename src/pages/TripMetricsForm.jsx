import React, { useEffect, useState, useCallback } from "react";
import { tripService } from "../services/tripService";

/* -------------------- helpers -------------------- */
const inferVehicleType = (vehicle) => {
  if (!vehicle) return "TRUCK";
  const mm = `${vehicle.make || ""} ${vehicle.model || ""}`.toUpperCase();
  if (mm.includes("TRAILER") || mm.includes("SEMI")) return "TRAILER";
  if (mm.includes("VAN") || mm.includes("BAKKIE")) return "VAN";
  if (mm.includes("CAR") || mm.includes("SEDAN") || mm.includes("HATCH"))
    return "CAR";
  return "TRUCK";
};

const formatDuration = (hours = 0) => {
  const minutes = Math.round(hours * 60);
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  return [
    d > 0 && `${d}d`,
    h > 0 && `${h}h`,
    m > 0 && d === 0 && `${m}m`,
  ].filter(Boolean).join(" ") || "0h";
};

/* -------------------- component -------------------- */
const TripMetricsForm = ({
  visible,
  onClose,
  onSuccess,
  tripId,
  initialMetrics = {},
  originLocation = "",
  destinationLocation = "",
  vehicleInfo,
}) => {
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [vehicleType, setVehicleType] = useState("TRUCK");
  const [calculatedMetrics, setCalculatedMetrics] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("calculator");

  const [formData, setFormData] = useState({
    originLocation: "",
    destinationLocation: "",
    totalDistance: "",
    estimatedDuration: "",
    fuelConsumption: "",
    estimatedCost: "",
    delays: "",
    incidents: "",
  });

  /* ---------------- MODAL OPEN / RESET ---------------- */
  useEffect(() => {
    if (!visible) return;

    setVehicleType(inferVehicleType(vehicleInfo));
    setError("");
    setCalculatedMetrics(null);

    setFormData({
      originLocation: originLocation || initialMetrics.originLocation || "",
      destinationLocation:
        destinationLocation || initialMetrics.destinationLocation || "",
      totalDistance: initialMetrics.totalDistance ?? initialMetrics.totalDistanceKm ?? "",
      estimatedDuration: initialMetrics.estimatedDuration ?? initialMetrics.totalDurationHours ?? "",
      fuelConsumption: initialMetrics.fuelConsumption ?? initialMetrics.fuelUsedLiters ?? "",
      estimatedCost: initialMetrics.estimatedCost ?? initialMetrics.costAmount ?? "",
      delays: initialMetrics.delays ?? "",
      incidents: initialMetrics.incidents ?? "",
    });
  }, [visible, initialMetrics, originLocation, destinationLocation, vehicleInfo]);

  /* ---------------- LOAD EXISTING METRICS ---------------- */
  useEffect(() => {
    if (!visible || !tripId) return;

    const loadMetrics = async () => {
      try {
        setLoading(true);
        const data = await tripService.getTripMetrics(tripId);
        if (!data) return;

        setFormData({
          originLocation: data.originLocation || "",
          destinationLocation: data.destinationLocation || "",
          totalDistance: data.totalDistanceKm || "",
          estimatedDuration: data.totalDurationHours || "",
          fuelConsumption: data.fuelUsedLiters || "",
          estimatedCost: data.costAmount || "",
          delays: data.idleTimeHours || "",
          incidents: data.incidentCount || "",
        });

        setCalculatedMetrics(data);
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [visible, tripId]);

  /* ---------------- AUTO CALCULATION ---------------- */
  const calculateMetrics = useCallback(async () => {
    try {
      setCalculating(true);
      setError("");

      if (!formData.originLocation || !formData.destinationLocation) {
        setError("Origin and destination are required.");
        return;
      }

      const dto = await tripService.calculateTripMetrics(
        formData.originLocation,
        formData.destinationLocation,
        vehicleType,
        tripId
      );

      setFormData((prev) => ({
        ...prev,
        totalDistance: dto.totalDistanceKm,
        estimatedDuration: dto.totalDurationHours,
        fuelConsumption: dto.fuelUsedLiters,
        estimatedCost: dto.costAmount,
      }));

      setCalculatedMetrics(dto);
    } catch (err) {
      console.error(err);
      setError("Auto calculation failed.");
    } finally {
      setCalculating(false);
    }
  }, [formData, vehicleType, tripId]);

  /* ---------------- SAVE ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const payload = {
        totalDistanceKm: Number(formData.totalDistance),
        totalDurationHours: Number(formData.estimatedDuration),
        fuelUsedLiters: Number(formData.fuelConsumption),
        costAmount: Number(formData.estimatedCost),
        idleTimeHours: Number(formData.delays || 0),
        incidentCount: Number(formData.incidents || 0),
      };

      await tripService.saveTripMetrics(tripId, payload);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Trip Metrics {tripId && `#${tripId}`}</h2>
        {error && <div className="error">{error}</div>}

        {/* ---------------- TABS ---------------- */}
        <div className="tabs">
          <button
            className={activeTab === "calculator" ? "active" : ""}
            onClick={() => setActiveTab("calculator")}
          >
            Auto Calculator
          </button>
          <button
            className={activeTab === "manual" ? "active" : ""}
            onClick={() => setActiveTab("manual")}
          >
            Manual / Editable
          </button>
        </div>

        {activeTab === "calculator" && (
          <div className="section">
            <input
              type="text"
              placeholder="Origin"
              value={formData.originLocation}
              onChange={(e) =>
                setFormData({ ...formData, originLocation: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Destination"
              value={formData.destinationLocation}
              onChange={(e) =>
                setFormData({ ...formData, destinationLocation: e.target.value })
              }
            />
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="TRUCK">Truck</option>
              <option value="TRAILER">Trailer</option>
              <option value="VAN">Van</option>
              <option value="CAR">Car</option>
            </select>
            <button onClick={calculateMetrics} disabled={calculating}>
              {calculating ? "Calculating..." : "Run Auto Calculation"}
            </button>

            {calculatedMetrics && (
              <div className="summary">
                <h3>System Calculated</h3>
                <p>Distance: {calculatedMetrics.totalDistanceKm} km</p>
                <p>Duration: {formatDuration(calculatedMetrics.totalDurationHours)}</p>
                <p>Fuel: {calculatedMetrics.fuelUsedLiters} L</p>
                <p>Estimated Cost: {calculatedMetrics.costAmount}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "manual" && (
          <form onSubmit={handleSubmit} className="section">
            <h3>Manual / Editable Metrics</h3>
            <input
              type="number"
              placeholder="Total Distance (km)"
              value={formData.totalDistance}
              onChange={(e) =>
                setFormData({ ...formData, totalDistance: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Duration (hours)"
              value={formData.estimatedDuration}
              onChange={(e) =>
                setFormData({ ...formData, estimatedDuration: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Fuel Used (liters)"
              value={formData.fuelConsumption}
              onChange={(e) =>
                setFormData({ ...formData, fuelConsumption: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Cost"
              value={formData.estimatedCost}
              onChange={(e) =>
                setFormData({ ...formData, estimatedCost: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Delays (hours)"
              value={formData.delays}
              onChange={(e) =>
                setFormData({ ...formData, delays: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Incidents"
              value={formData.incidents}
              onChange={(e) =>
                setFormData({ ...formData, incidents: e.target.value })
              }
            />
            <div className="actions">
              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Metrics"}
              </button>
              <button type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TripMetricsForm;
