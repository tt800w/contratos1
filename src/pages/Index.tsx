import Header from "@/components/Header";
import ContractCard from "@/components/ContractCard";

const contracts = [
  { title: "Lumni Menores de edad", route: "/lumni-menores" },
  { title: "Lumni Mayores de edad", route: "/lumni-mayores" },
  { title: "Recursos Propios Estratos 1,2,3 Menores", route: "/rp-123-menores" },
  { title: "Recursos Propios Estratos 1,2,3 Mayores", route: "/rp-123-mayores" },
  { title: "Recursos Propios Estratos 5 y 6 Menores", route: "/rp-56-menores" },
  { title: "Recursos Propios Estratos 5 y 6 Mayores", route: "/rp-56-mayores" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Automatización de Contratos
          </h1>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {contracts.map((contract, index) => (
            <ContractCard
              key={index}
              title={contract.title}
              route={contract.route}
            />
          ))}
        </div>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
              <a href="#" className="hover:text-foreground transition-colors">Términos</a>
              <a href="#" className="hover:text-foreground transition-colors">Soporte</a>
            </div>
            <p className="text-xs text-muted-foreground tracking-wider">
              © 2026 CAMPUSLANDS • SECURE ENVIRONMENT
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
