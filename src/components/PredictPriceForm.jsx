// src/components/PredictPriceForm.jsx (New Component)
import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form'; // useFieldArray for dynamic inputs
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Button from './ui/button'; // Your Button component
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axios'; // Your axios instance

// --- Mock Data for Dropdowns (Replace with API calls) ---
const MOCK_COMMODITIES = ['Rice', 'Wheat', 'Onion', 'Potato', 'Tomato'];
const MOCK_STATES = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra'];
const MOCK_DISTRICTS = {
  Punjab: ['Ludhiana', 'Amritsar'],
  Haryana: ['Karnal', 'Hisar'],
  'Uttar Pradesh': ['Lucknow', 'Meerut'],
  Maharashtra: ['Nashik', 'Pune'],
};
// --- End Mock Data ---


// --- Zod Schema for Client-Side Validation ---
// This needs to be carefully crafted based on your model's requirements
const predictionFormSchema = z.object({
  commodityName: z.string().min(1, "Commodity is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  marketName: z.string().optional(),
  n_periods: z.coerce.number().int().positive("Forecast days must be a positive number").min(1).max(30, "Max 30 days"), // Coerce to number
  
  // Example: Assuming ONE exogenous variable named 'future_exog1'
  // If you have multiple, add them similarly.
  // This structure assumes a comma-separated string which we'll parse.
  // Or use useFieldArray for individual inputs.
  future_exog1_values_str: z.string().min(1, "Future exogenous values are required")
    .refine(val => val.split(',').every(v => !isNaN(parseFloat(v.trim()))), {
        message: "All values must be comma-separated numbers."
    }),
  // Add more future_exog_... fields as needed, matching your Python model's exog variable names
});
// --- End Zod Schema ---


const PredictPriceForm = ({ onPredictionResult, onLoadingChange }) => {
  const [districtsForState, setDistrictsForState] = useState([]);
  // Add states for markets if you implement market selection
  // const [marketsForDistrict, setMarketsForDistrict] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    control, // For Controller if needed, or for watching values
    formState: { errors, isSubmitting },
    setValue, // To dynamically set n_periods for exog_values length check
  } = useForm({
    resolver: zodResolver(predictionFormSchema),
    defaultValues: {
      commodityName: '',
      state: '',
      district: '',
      marketName: '',
      n_periods: 7,
      future_exog1_values_str: '', // Initialize as empty string
    },
  });

  const selectedState = watch('state');
  const nPeriods = watch('n_periods'); // Watch n_periods to guide user on exog input length

  useEffect(() => {
    if (selectedState && MOCK_DISTRICTS[selectedState]) {
      setDistrictsForState(MOCK_DISTRICTS[selectedState]);
      setValue('district', ''); // Reset district when state changes
      // setValue('marketName', ''); // Reset market if state changes
    } else {
      setDistrictsForState([]);
      setValue('district', '');
      // setValue('marketName', '');
    }
  }, [selectedState, setValue]);

  // Add similar useEffect for markets if marketName is implemented and depends on district

  const onSubmit = async (formData) => {
    if (onLoadingChange) onLoadingChange(true);
    try {
      const futureExog1 = formData.future_exog1_values_str.split(',').map(s => parseFloat(s.trim()));
      
      if (futureExog1.length !== formData.n_periods) {
        toast.error(`Number of exogenous values (${futureExog1.length}) must match forecast days (${formData.n_periods}).`);
        if (onLoadingChange) onLoadingChange(false);
        return;
      }

      const payload = {
        commodityName: formData.commodityName,
        state: formData.state,
        district: formData.district,
        marketName: formData.marketName || undefined, // Send only if present
        n_periods: formData.n_periods,
        future_exog1: futureExog1, // This key MUST match what backend expects
        // Add other future_exog_... arrays here
      };
      
      console.log("Sending prediction payload:", payload);

      // Replace with your actual API endpoint for predictions
      // This should go to your MERN backend, which then calls Python ML service
      const response = await axiosInstance.post('/api/predictions', payload); 
      // OR await axiosInstance.post('/api/crop-prices/predict', payload);
      
      console.log("Prediction API response:", response.data);

      if (response.data.success) {
        onPredictionResult(response.data.data); // Pass prediction data to parent
        toast.success("Prediction successful!");
      } else {
        toast.error(response.data.error || "Prediction failed.");
      }
    } catch (error) {
      console.error("Prediction form submission error:", error);
      toast.error(error.response?.data?.error || error.message || "An error occurred during prediction.");
    } finally {
      if (onLoadingChange) onLoadingChange(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="p-6 space-y-6 bg-white rounded-lg shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold text-primary">Get Price Prediction</h2>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Commodity */}
        <div>
          <label htmlFor="commodityName" className="block text-sm font-medium text-gray-700">Commodity *</label>
          <select
            id="commodityName"
            {...register('commodityName')}
            className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.commodityName ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select Commodity</option>
            {MOCK_COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.commodityName && <p className="mt-1 text-xs text-red-600">{errors.commodityName.message}</p>}
        </div>

        {/* Number of Days to Forecast */}
        <div>
          <label htmlFor="n_periods" className="block text-sm font-medium text-gray-700">Forecast Days (1-30) *</label>
          <input
            type="number"
            id="n_periods"
            {...register('n_periods')}
            min="1"
            max="30"
            className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.n_periods ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.n_periods && <p className="mt-1 text-xs text-red-600">{errors.n_periods.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">State *</label>
          <select
            id="state"
            {...register('state')}
            className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select State</option>
            {MOCK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>}
        </div>

        {/* District */}
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700">District *</label>
          <select
            id="district"
            {...register('district')}
            disabled={!selectedState || districtsForState.length === 0}
            className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary disabled:bg-gray-100 ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select District</option>
            {districtsForState.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {errors.district && <p className="mt-1 text-xs text-red-600">{errors.district.message}</p>}
        </div>

        {/* Market (Optional) */}
        <div>
          <label htmlFor="marketName" className="block text-sm font-medium text-gray-700">Market (Optional)</label>
          <input
            type="text"
            id="marketName"
            {...register('marketName')}
            placeholder="e.g., Azadpur Mandi"
            className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.marketName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.marketName && <p className="mt-1 text-xs text-red-600">{errors.marketName.message}</p>}
        </div>
      </div>
      
      {/* Exogenous Variable(s) Input */}
      {/* This is a simplified example for ONE exogenous variable. 
          For multiple, you'd repeat this block or use useFieldArray for dynamic inputs. */}
      <div>
        <label htmlFor="future_exog1_values_str" className="block text-sm font-medium text-gray-700">
          Future Supply Indicator Values (comma-separated for {nPeriods || 0} days) *
        </label>
        <textarea
          id="future_exog1_values_str"
          {...register('future_exog1_values_str')}
          rows="2"
          placeholder={`Enter ${nPeriods || 0} comma-separated numbers, e.g., 100,102,98...`}
          className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary ${errors.future_exog1_values_str ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.future_exog1_values_str && <p className="mt-1 text-xs text-red-600">{errors.future_exog1_values_str.message}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Provide {nPeriods > 0 ? nPeriods : 'the selected number of'} future values for the model's external factor (e.g., supply index).
        </p>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" className="w-full md:w-auto" isLoading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Predicting...' : 'Predict Price'}
        </Button>
      </div>
    </motion.form>
  );
};

export default PredictPriceForm;