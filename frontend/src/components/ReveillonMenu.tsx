import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Star, ChefHat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ReveillonMenu = () => {
  const [reveillonData, setReveillonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour scroller vers la section contact
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    const fetchReveillonData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/reveillon');
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setReveillonData(data.data);
      } catch (err) {
        setError(err.message);
        console.error('Erreur lors du chargement des données réveillon:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReveillonData();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-accent/10">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#cbb36f]" />
              <p className="text-lg text-muted-foreground">Chargement du menu réveillon...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-red-600 mb-4">Erreur lors du chargement du menu réveillon</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!reveillonData?.plateaux || reveillonData.plateaux.length === 0) {
    return (
      <section className="py-20 bg-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Aucun menu réveillon disponible pour le moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reveillon-menu" className="py-20 bg-accent/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Carte Spéciale Réveillon
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pour des fêtes gourmandes réussies
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto mb-16">
          {reveillonData.plateaux.map((plateau, index) => (
            <div
              key={plateau._id || index}
              className="group relative"
            >
              {/* Card Container */}
              <Card className="relative overflow-hidden bg-white shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 border-0 rounded-3xl">

                {/* Premium Badge */}
                {plateau.isPremium && (
                  <div className="absolute top-6 right-6 z-20">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-[#cbb36f] to-[#99771b] text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      <Star className="h-4 w-4" />
                      Premium
                    </div>
                  </div>
                )}

                {/* Image Section */}
                <div className="relative h-[32rem] overflow-hidden rounded-t-3xl">
                  <img
                    src={plateau.image}
                    alt={plateau.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Floating Price Tag */}
                  <div className="absolute bottom-6 left-1/3 flex items-center justify-center gap-4">
                    <div className="bg-white/75 backdrop-blur-md rounded-2xl px-6 py-3 shadow-2xl items-center gap-4">
                      <div className="text-3xl font-bold text-gray-800">{plateau.price}</div>
                      <div className="text-sm text-gray-600 font-medium">par plateau</div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <CardContent className="p-8 bg-gradient-to-br from-gray-50 to-white">
                  {/* Title */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <h3 className="text-3xl font-bold text-gray-800">{plateau.name || plateau.title}</h3>
                  </div>

                  {/* Description */}
                  {plateau.description && (
                    <p className="text-gray-600 text-center mb-6">{plateau.description}</p>
                  )}

                  {/* Items Grid */}
                  <div className="mb-6">
                    {plateau.items && plateau.items.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {plateau.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center justify-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                          >
                            <span className="text-gray-700 font-medium text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {plateau.lastItem && (
                      <span className="grid grid-cols-1 text-center text-gray-700 font-medium text-sm p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                        {plateau.lastItem}
                      </span>
                    )}
                  </div>

                  {/* Quantity info */}
                  {plateau.quantity && (
                    <div className="text-center text-sm text-gray-600 mb-4">
                      Pour {plateau.quantity} personnes
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full bg-gradient-to-r from-[#cbb36f] to-[#99771b] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    onClick={scrollToContact}
                  >
                    <span>Commander</span>
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>

              </Card>

              {/* Decorative Elements */}
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-[#e8dcc0] to-[#d4c49a] rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-gradient-to-tr from-[#d4c49a] to-[#e8dcc0] rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
