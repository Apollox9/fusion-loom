import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Smartphone, Building2, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const PaymentMethodsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} copied successfully`
    });
  };

  const mobileMoneyMethods = [
    {
      name: "M-Pesa",
      number: "0754 123 456",
      logo: "📱",
      color: "bg-green-500"
    },
    {
      name: "Airtel Money",
      number: "0678 987 654",
      logo: "📲",
      color: "bg-red-500"
    },
    {
      name: "Mixx by Yas",
      number: "0745 555 777",
      logo: "💳",
      color: "bg-purple-500"
    },
    {
      name: "Halopesa",
      number: "0622 333 444",
      logo: "📞",
      color: "bg-blue-500"
    },
    {
      name: "Selcom",
      number: "898989",
      logo: "💰",
      color: "bg-orange-500"
    }
  ];

  const bankAccounts = [
    {
      name: "CRDB Bank",
      accountNumber: "0150 1234 5678",
      accountName: "Project Fusion Ltd",
      logo: "🏦",
      color: "bg-blue-600"
    },
    {
      name: "NMB Bank",
      accountNumber: "1020 9876 5432",
      accountName: "Project Fusion Ltd",
      logo: "🏛️",
      color: "bg-green-600"
    },
    {
      name: "NBC Bank",
      accountNumber: "0110 1111 2222",
      accountName: "Project Fusion Ltd",
      logo: "🏢",
      color: "bg-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold font-display">Payment Methods</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 leading-tight">
              <span className="text-gradient">Payment Methods</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Choose your preferred payment method to complete your uniform order. 
              All payments are processed securely.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mobile Money */}
            <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-primary" />
                  <span>Mobile Money</span>
                </CardTitle>
                <CardDescription>
                  Pay using your mobile money account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mobileMoneyMethods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${method.color} rounded-full flex items-center justify-center text-white text-lg`}>
                        {method.logo}
                      </div>
                      <div>
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.number}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(method.number, method.name)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bank Accounts */}
            <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Building2 className="w-6 h-6 text-primary" />
                  <span>Bank Transfer</span>
                </CardTitle>
                <CardDescription>
                  Transfer directly to our bank accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bankAccounts.map((bank, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${bank.color} rounded-full flex items-center justify-center text-white text-lg`}>
                          {bank.logo}
                        </div>
                        <div>
                          <p className="font-semibold">{bank.name}</p>
                          <p className="text-sm text-muted-foreground">{bank.accountName}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bank.accountNumber, `${bank.name} account`)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="bg-muted/30 rounded p-3">
                      <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                      <p className="font-mono font-semibold">{bank.accountNumber}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-8 shadow-lg animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <CardHeader>
              <CardTitle>Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">For Mobile Money:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Dial your provider's USSD code</li>
                    <li>Select "Send Money" or "Lipa"</li>
                    <li>Enter the recipient number</li>
                    <li>Enter the exact amount</li>
                    <li>Complete the transaction</li>
                    <li>Keep the confirmation SMS</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">For Bank Transfer:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Visit your bank or use mobile banking</li>
                    <li>Select "Transfer" or "Send Money"</li>
                    <li>Enter the account details above</li>
                    <li>Enter the exact amount</li>
                    <li>Include your school name in reference</li>
                    <li>Keep the transfer receipt</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  <strong>Important:</strong> After making payment, upload your receipt/confirmation 
                  when submitting your session. This helps us verify and process your order quickly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PaymentMethodsPage;