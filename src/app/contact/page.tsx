'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/navigation';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  HelpCircle,
  Send,
  ArrowLeft
} from 'lucide-react';

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation currentPage="contact" />
      
      <div className="container mx-auto p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button 
              variant="outline" 
              onClick={handleGoBack}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">Contact Us</h1>
              <p className="text-xl text-blue-200">
                We're here to help! Get in touch with our support team.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-6">
                  <CardTitle className="text-xl font-semibold flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Send us a Message
                  </CardTitle>
                  <p className="text-blue-100 text-sm">
                    Fill out the form below and we'll respond as soon as possible
                  </p>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <Input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full"
                        placeholder="How can we help you?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full resize-none"
                        placeholder="Please describe your issue or question in detail..."
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <Card className="bg-white border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white pb-4">
                  <CardTitle className="text-lg font-semibold">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Phone Support</div>
                      <div className="text-gray-600">+251 911 123 456</div>
                      <div className="text-sm text-gray-500">Mon-Fri, 9AM-6PM</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Email Support</div>
                      <div className="text-gray-600">support@ethiobingo.com</div>
                      <div className="text-sm text-gray-500">24/7 Response</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Office Location</div>
                      <div className="text-gray-600">Bole Road, Addis Ababa</div>
                      <div className="text-sm text-gray-500">Ethiopia</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Business Hours</div>
                      <div className="text-gray-600">24/7 Online Support</div>
                      <div className="text-sm text-gray-500">Games available round the clock</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Card */}
              <Card className="bg-white border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <HelpCircle className="w-5 h-5 mr-2" />
                    Quick Help
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-900 text-sm">How do I deposit money?</div>
                      <div className="text-blue-700 text-xs mt-1">
                        Use our secure payment system or mobile money
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-900 text-sm">How do I withdraw winnings?</div>
                      <div className="text-green-700 text-xs mt-1">
                        Winnings are automatically credited to your account
                      </div>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-semibold text-purple-900 text-sm">Is the game fair?</div>
                      <div className="text-purple-700 text-xs mt-1">
                        All games use certified random number generators
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Chat Card */}
              <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl mb-3">💬</div>
                    <div className="font-semibold text-lg mb-2">Need Immediate Help?</div>
                    <div className="text-sm opacity-90 mb-4">
                      Chat with our support team instantly
                    </div>
                    <Button 
                      variant="secondary"
                      className="bg-white text-yellow-600 hover:bg-gray-100 font-semibold"
                    >
                      Start Live Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Response Time Promise */}
          <Card className="mt-8 bg-white/10 backdrop-blur-md border border-white/20 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-semibold text-lg mb-2">Our Response Promise</div>
                <div className="text-blue-200">
                  We typically respond to all inquiries within 24 hours. For urgent matters, 
                  please use our live chat or call our hotline for immediate assistance.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}