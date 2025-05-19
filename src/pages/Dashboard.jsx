// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import Button from '../components/ui/button';
import { TrendingUp, BellRing, UserCircle, Wheat, AlertTriangle, BarChart3, LineChart as LineChartIcon } from 'lucide-react'; // Added LineChartIcon for clarity
import PredictPriceForm from '../components/PredictPriceForm'; // Import the new form
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // For displaying results

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    trackedCrops: 0,
    activeAlerts: 0,
    recentPredictionsMade: 0, // Renamed for clarity
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // State for prediction form results
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingStats(true);
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
      
      setDashboardStats({
        trackedCrops: user?.myManagedCrops?.length || 0, // Use myManagedCrops from user object
        activeAlerts: user?.alertPreferences?.alerts?.length || 0, // Use actual alert preferences
        recentPredictionsMade: 5, // This would typically come from backend user activity log
      });
      setIsLoadingStats(false);
    };

    if (user) {
      fetchDashboardData();
    } else {
      setIsLoadingStats(false); // Not logged in, no stats to load
    }
  }, [user]);

  const handlePredictionResult = (result) => {
    console.log("Dashboard received prediction result:", result);
    setPredictionResult(result);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const quickActionVariants = {
    hover: { scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" },
    tap: { scale: 0.95 }
  };

  if (isLoadingStats && !user) { // Initial auth check might still be loading
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold md:text-4xl text-primary">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Here's your crop price intelligence dashboard.
        </p>
      </motion.div>

      {/* Stats Overview */}
      {isLoadingStats ? (
         <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-32 bg-gray-200 animate-pulse"></Card>
            ))}
         </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.div variants={cardVariants}>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Managed Crops</CardTitle>
                <Wheat className="w-5 h-5 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.trackedCrops}</div>
                {/* <p className="text-xs text-gray-500">+2 from last week</p> */}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <BellRing className="w-5 h-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.activeAlerts}</div>
                {/* <p className="text-xs text-gray-500">1 new alert today</p> */}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Recent Predictions</CardTitle>
                <LineChartIcon className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.recentPredictionsMade}</div>
                {/* <p className="text-xs text-gray-500">Viewed in last 7 days</p> */}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Predict Price Form Section */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }} // Slightly delay this section
      >
        <PredictPriceForm 
            onPredictionResult={handlePredictionResult}
            onLoadingChange={setIsPredictionLoading}
        />
      </motion.div>

      {/* Prediction Results Display Section */}
      {isPredictionLoading && (
        <motion.div 
            className="flex items-center justify-center p-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
          <p className="ml-3 text-primary">Fetching prediction...</p>
        </motion.div>
      )}

      {predictionResult && !isPredictionLoading && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-xl text-primary">
                    Prediction Results for {predictionResult.commodityName || 'Selected Crop'}
                    {predictionResult.location && ` in ${predictionResult.location}`}
                </CardTitle>
                {predictionResult.marketName && <CardDescription>Market: {predictionResult.marketName}</CardDescription>}
            </CardHeader>
            <CardContent>
                {predictionResult.predictions && predictionResult.predictions.length > 0 ? (
                <div className="h-80 md:h-96"> {/* Give chart a height */}
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictionResult.predictions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }}/>
                        <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fontSize: 10 }}/>
                        <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Price']} />
                        <Legend />
                        <Line type="monotone" dataKey="price" name="Predicted Price" stroke="#203a8f" strokeWidth={2} activeDot={{ r: 6 }} dot={{r:3}} />
                        {predictionResult.predictions[0]?.lower_ci !== undefined && (
                            <Line type="monotone" dataKey="lower_ci" name="Lower CI" stroke="#00a86b" strokeDasharray="3 3" dot={false} />
                        )}
                        {predictionResult.predictions[0]?.upper_ci !== undefined && (
                            <Line type="monotone" dataKey="upper_ci" name="Upper CI" stroke="#00a86b" strokeDasharray="3 3" dot={false} />
                        )}
                    </LineChart>
                    </ResponsiveContainer>
                </div>
                ) : (
                <p className="py-4 text-center text-gray-500">No prediction data to display or data is in an unexpected format.</p>
                )}
                {/* Optional: Display raw data for debugging */}
                {/* <pre className="p-4 mt-4 overflow-x-auto text-xs bg-gray-100 rounded">
                {JSON.stringify(predictionResult, null, 2)}
                </pre> */}
            </CardContent>
            </Card>
        </motion.div>
      )}


      {/* Quick Actions - Can be kept or removed if form is primary focus */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* ... Your existing quick action cards ... */}
        {/* Example:
        <motion.div variants={quickActionVariants} whileHover="hover" whileTap="tap">
          <Link to="/my-crops">
            <Card className="h-full transition-colors cursor-pointer hover:border-primary">
              <CardHeader>
                <Wheat className="w-8 h-8 mb-2 text-primary" />
                <CardTitle className="text-lg">Manage My Crops</CardTitle>
                <CardDescription>
                  Track your planted crops and manage harvest details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button variant="primary" className="w-full mt-2">
                    Go to My Crops
                  </Button>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
        */}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;