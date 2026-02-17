

class OddsConverter:


    @staticmethod
    def american_to_decimal(american):
        if american > 0:
            return (american / 100) + 1
        else:
            return (100 / abs(american)) + 1
        
    @staticmethod
    def american_to_probability(american):
        if american > 0:
            return 100 / (american + 100)
        else:
            return abs(american) / (abs(american) + 100)
        
    @staticmethod
    def decimal_to_american(decimal):
        if decimal >= 2.0:
            return  (decimal - 1) * 100
        else:
            return -100 /(decimal - 1)
        
    @staticmethod
    def decimal_to_probability(decimal):
        return 1 / decimal 